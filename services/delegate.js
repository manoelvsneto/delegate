const axios = require('axios');
const logger = require('../logger');
const { trace } = require('@opentelemetry/api');

class DelegateService {
  async delegateRequest(requestData) {
    const { url, method, body } = requestData;
    const tracer = trace.getTracer('express-kafka-api-tracer');

    // Create a span for the delegate request
    return tracer.startActiveSpan(`HTTP ${method} ${url}`, async (span) => {
      try {
        // Add span attributes
        span.setAttribute('http.url', url);
        span.setAttribute('http.method', method);
        
        logger.info({ url, method }, 'Delegating request');
        
        const response = await axios({
          method: method.toLowerCase(),
          url,
          data: method === 'POST' ? body : undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Add response attributes to span
        span.setAttribute('http.status_code', response.status);
        
        logger.info({ 
          url, 
          method, 
          statusCode: response.status 
        }, 'Delegation request completed');

        span.end();
        return response.data;
      } catch (error) {
        // Record the error in the span
        span.setAttribute('error', true);
        span.setAttribute('error.message', error.message);
        
        if (error.response) {
          span.setAttribute('http.status_code', error.response.status);
          logger.error({ 
            url, 
            method, 
            statusCode: error.response.status,
            error: error.message 
          }, 'Delegation request failed');
        } else {
          logger.error({ 
            url, 
            method, 
            error: error.message 
          }, 'Delegation request failed');
        }
        
        span.end();
        throw error;
      }
    });
  }
}

module.exports = new DelegateService();