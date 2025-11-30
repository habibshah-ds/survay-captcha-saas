// src/modules/questions/question.controller.js
const service = require('./question.service');

exports.listQuestions = async (req, res, next) => {
  try {
    const orgId = req.user.org_id; // adjust according to your auth
    const rows = await service.listQuestions(orgId);
    res.json({ data: rows });
  } catch (err) { next(err); }
};

exports.getQuestion = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const id = req.params.id;
    const q = await service.getQuestion(orgId, id);
    if (!q) return res.status(404).json({ error: 'Not found' });
    res.json({ data: q });
  } catch (err) { next(err); }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const payload = req.body;
    const created = await service.createQuestion(orgId, payload);
    res.status(201).json({ data: created });
  } catch (err) { next(err); }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const id = req.params.id;
    const payload = req.body;
    const updated = await service.updateQuestion(orgId, id, payload);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ data: updated });
  } catch (err) { next(err); }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const id = req.params.id;
    await service.deleteQuestion(orgId, id);
    res.status(204).end();
  } catch (err) { next(err); }
};
