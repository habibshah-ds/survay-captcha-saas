const { logger } = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  // Log error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let errorResponse = {
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  };

  // Set status code
  const statusCode = err.statusCode || err.status || 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation failed';
    errorResponse.details = err.details;
  } else if (err.code === '23505') { // PostgreSQL unique violation
    errorResponse.error = 'Conflict';
    errorResponse.message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    errorResponse.error = 'Invalid reference';
    errorResponse.message = 'Referenced resource not found';
  }

  // Add retry-after for rate limiting
  if (err.statusCode === 429 && err.retryAfter) {
    res.set('Retry-After', err.retryAfter);
    errorResponse.retry_after = err.retryAfter;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorMiddleware;
