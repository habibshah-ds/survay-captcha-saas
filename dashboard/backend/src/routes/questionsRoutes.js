// backend/src/routes/questionsRoutes.js
import express from 'express';
import authRequired from '../middleware/authRequired.js';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listChoicesForQuestion,
  createChoice,
  deleteChoice
} from '../controllers/questionsController.js';

const router = express.Router();

// Public read routes could be unauthenticated if you want; here guarded
router.get('/', authRequired, listQuestions);
router.post('/', authRequired, createQuestion);

router.get('/:id', authRequired, getQuestion);
router.put('/:id', authRequired, updateQuestion);
router.delete('/:id', authRequired, deleteQuestion);

// Choices
router.get('/:id/choices', authRequired, listChoicesForQuestion);
router.post('/:id/choices', authRequired, createChoice);
router.delete('/choices/:choiceId', authRequired, deleteChoice);

export default router;
