const express = require('express');
const router = express.Router();
const delegateService = require('../services/delegate');
const logger = require('../logger');
const { trace } = require('@opentelemetry/api');

router.post('/delegate', async (req, res, next) => {
  const tracer = trace.getTracer('express-kafka-api-tracer');
  
  return tracer.startActiveSpan('delegate_request', async (span) => {
    try {
      const { url, method, body } = req.body;
      
      // Validate request
      if (!url || !method) {
        span.setAttribute('error', true);
        span.setAttribute('error.message', 'Missing required fields: url and method');
        span.end();
        
        return res.status(400).json({
          error: 'Missing required fields: url and method',
          statusCode: 400
        });
      }
      
      // Validate method
      if (method !== 'GET' && method !== 'POST') {
        span.setAttribute('error', true);
        span.setAttribute('error.message', 'Method must be GET or POST');
        span.end();
        
        return res.status(400).json({
          error: 'Method must be GET or POST',
          statusCode: 400
        });
      }
      
      // Add span attributes
      span.setAttribute('http.url', url);
      span.setAttribute('http.method', method);
      
      // Delegate the request
      const responseData = await delegateService.delegateRequest({ url, method, body });
      
      span.end();
      return res.json(responseData);
    } catch (error) {
      span.setAttribute('error', true);
      span.setAttribute('error.message', error.message);
      span.end();
      
      // If the error comes from the delegated service, pass the status code
      if (error.response) {
        return res.status(error.response.status).json({
          error: `Delegated request failed: ${error.message}`,
          statusCode: error.response.status,
          response: error.response.data
        });
      }
      
      next(error);
    }
  });
});

module.exports = router;