const express = require('express');
const router = express.Router();
const kafkaService = require('../services/kafka');
const logger = require('../logger');
const { trace } = require('@opentelemetry/api');

router.post('/publish', async (req, res, next) => {
  const tracer = trace.getTracer('express-kafka-api-tracer');
  
  return tracer.startActiveSpan('publish_to_kafka', async (span) => {
    try {
      const { topic, message } = req.body;
      
      // Validate request
      if (!topic || !message) {
        span.setAttribute('error', true);
        span.setAttribute('error.message', 'Missing required fields: topic and message');
        span.end();
        
        return res.status(400).json({
          error: 'Missing required fields: topic and message',
          statusCode: 400
        });
      }
      
      // Add span attributes
      span.setAttribute('kafka.topic', topic);
      
      // Process the message asynchronously - fire and forget
      kafkaService.publishMessage(topic, message)
        .catch(error => {
          logger.error({ error, topic }, 'Failed to publish message to Kafka after response sent');
        });
      
      logger.info({ topic }, 'Request accepted for processing');
      
      span.end();
      return res.status(202).send();
    } catch (error) {
      span.setAttribute('error', true);
      span.setAttribute('error.message', error.message);
      span.end();
      
      next(error);
    }
  });
});

module.exports = router;