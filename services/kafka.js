const { Kafka } = require('kafkajs');
const { HTTP } = require('cloudevents');
const config = require('../config');
const logger = require('../logger');

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });
    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Successfully connected to Kafka');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Kafka');
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from Kafka');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from Kafka');
    }
  }

  async publishMessage(topic, message) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // Create a CloudEvent
      const cloudEvent = new HTTP({
        source: 'express-kafka-api',
        type: `${topic}.event`,
        id: Date.now().toString(),
        time: new Date().toISOString(),
        data: message,
      });

      // Convert CloudEvent to binary mode format
      const { headers, body } = HTTP.binary(cloudEvent);
      
      // Send message to Kafka
      await this.producer.send({
        topic,
        messages: [
          { 
            value: body,
            headers
          }
        ],
      });

      logger.info({ topic }, 'Message published to Kafka');
    } catch (error) {
      logger.error({ error, topic }, 'Failed to publish message to Kafka');
      throw error;
    }
  }
}

module.exports = new KafkaService();