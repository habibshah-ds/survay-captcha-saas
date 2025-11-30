// src/modules/questions/question.routes.js
const express = require('express');
const router = express.Router();
const controller = require('./question.controller');
const authRequired = require('../../middleware/authRequired'); // keep using your middleware

// public: list questions (for owner)
router.get('/', authRequired, controller.listQuestions);
router.post('/', authRequired, controller.createQuestion);
router.get('/:id', authRequired, controller.getQuestion);
router.put('/:id', authRequired, controller.updateQuestion);
router.delete('/:id', authRequired, controller.deleteQuestion);

module.exports = router;
