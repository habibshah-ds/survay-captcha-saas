// src/app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & helpers
app.use(helmet());
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// If behind proxy (nginx)
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// CORS for local dev if needed (adjust origin in env)
const cors = require('cors');
const corsOptions = { origin: process.env.CORS_ORIGIN || true, credentials: true };
app.use(cors(corsOptions));

// Mount routes
app.use('/api/v1', routes);

// Healthcheck
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

// Error handler must be last
app.use(errorHandler);

module.exports = app;
