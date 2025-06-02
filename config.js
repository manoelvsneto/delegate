const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  kafka: {
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'express-kafka-client',
  },
  opentelemetry: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: process.env.OTEL_SERVICE_NAME || 'express-kafka-api',
  }
};

module.exports = config;