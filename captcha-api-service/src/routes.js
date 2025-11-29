const express = require('express');
const router = express.Router();

const validationMiddleware = require('./middleware/validationMiddleware');
const captchaController = require('./controllers/captchaController');
const authMiddleware = require('./middleware/authMiddleware');

// Challenge request from browser
router.post(
  '/captcha/create',
  authMiddleware.requireSiteKey,
  validationMiddleware([]),   // no required fields yet
  captchaController.createChallenge
);

// Complete challenge
router.post(
  '/captcha/complete',
  authMiddleware.requireSiteKey,
  validationMiddleware(['challenge_id', 'altcha_solution', 'survey_answer']),
  captchaController.completeChallenge
);

// Server-to-server verification
router.post(
  '/captcha/verify-token',
  authMiddleware.requireApiKey,
  validationMiddleware(['token']),
  captchaController.verifyToken
);

module.exports = router;
