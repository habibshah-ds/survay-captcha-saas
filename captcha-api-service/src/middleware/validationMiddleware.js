// src/middleware/validationMiddleware.js
'use strict';

/**
 * A minimal validation middleware.
 * 
 * Usage:
 * router.post('/captcha/create', validationMiddleware(['difficulty']), controller.createChallenge);
 * 
 * It only checks:
 *   - required fields exist
 *   - are not null or undefined
 * 
 * This avoids breaking the backend with malformed requests,
 * without requiring a full schema validator (Joi/Zod).
 */
module.exports = function validationMiddleware(requiredFields = []) {
  return function (req, res, next) {
    if (!Array.isArray(requiredFields) || requiredFields.length === 0) {
      return next(); // no validation needed
    }

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    next();
  };
};
