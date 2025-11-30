// backend/src/controllers/questionsController.js
import * as QuestionService from '../services/questionService.js';

export async function listQuestions(req, res, next) {
  try {
    const clientId = req.user?.client_id || null;
    const rows = await QuestionService.listQuestions({ clientId });
    res.json(rows);
  } catch (err) { next(err); }
}

export async function getQuestion(req, res, next) {
  try {
    const q = await QuestionService.getQuestionById(req.params.id);
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json(q);
  } catch (err) { next(err); }
}

export async function createQuestion(req, res, next) {
  try {
    const payload = req.body;
    // payload must include: survey_id, type, prompt, metadata (optional)
    const q = await QuestionService.createQuestion(payload);
    res.status(201).json(q);
  } catch (err) { next(err); }
}

export async function updateQuestion(req, res, next) {
  try {
    const q = await QuestionService.updateQuestion(req.params.id, req.body);
    res.json(q);
  } catch (err) { next(err); }
}

export async function deleteQuestion(req, res, next) {
  try {
    await QuestionService.deleteQuestion(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

// Choices
export async function listChoicesForQuestion(req, res, next) {
  try {
    const choices = await QuestionService.listChoices(req.params.id);
    res.json(choices);
  } catch (err) { next(err); }
}

export async function createChoice(req, res, next) {
  try {
    const created = await QuestionService.createChoice(req.params.id, req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
}

export async function deleteChoice(req, res, next) {
  try {
    await QuestionService.deleteChoice(req.params.choiceId);
    res.json({ ok: true });
  } catch (err) { next(err); }
}
