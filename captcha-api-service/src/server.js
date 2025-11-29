'use strict';

const express = require('express');
const logger = require('./utils/logger');    // ✅ FIXED
const app = require('./app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const server = express();

    // Mount the main app router
    server.use(app);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Global error handlers
process.on('uncaughtException', (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on('unhandledRejection', (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

startServer();

