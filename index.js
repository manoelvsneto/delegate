// Initialize OpenTelemetry - this must be done before importing any other modules
require('dotenv').config();
const { setupOpenTelemetry } = require('./otel');
const tracer = setupOpenTelemetry();

// Import dependencies
const express = require('express');
const yaml = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const logger = require('./logger');
const kafkaService = require('./services/kafka');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const publishRoutes = require('./routes/publishRoutes');
const delegateRoutes = require('./routes/delegateRoutes');
const systemRoutes = require('./routes/systemRoutes');

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    headers: req.headers,
  }, 'Incoming request');
  next();
});

// Load Swagger document
const swaggerDocument = yaml.load('./swagger.yaml');

// Swagger UI endpoint
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/', publishRoutes);
app.use('/', delegateRoutes);
app.use('/', systemRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(config.server.port, async () => {
  try {
    // Connect to Kafka
    await kafkaService.connect();
    logger.info(`Server running on port ${config.server.port}`);
    logger.info('OpenTelemetry tracing enabled');
    logger.info(`Swagger documentation available at http://localhost:${config.server.port}/docs`);
  } catch (error) {
    logger.error({ error }, 'Failed to start server properly');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Shutting down gracefully...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await kafkaService.disconnect();
      logger.info('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

module.exports = app;