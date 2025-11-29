// src/app.js
'use strict';

const express = require('express');
const morgan = require('morgan');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

const app = express();

// enable json
app.use(express.json());

// Logging (dev-friendly)
app.use(morgan('dev'));

// Trust proxy (required for rate limits & real IPs behind Nginx/Cloudflare)
app.set('trust proxy', true);

// Global lightweight rate limit (basic protection)
app.use(rateLimitMiddleware({ windowSec: 60, limit: 100 }));

// API routes
app.use(routes);

// Global error handler
app.use(errorMiddleware);

module.exports = app;

