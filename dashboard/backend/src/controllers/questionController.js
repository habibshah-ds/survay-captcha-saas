// backend/src/controllers/questionController.js
import {
  createQuestion,
  getQuestions,
  deleteQuestion,
  getQuestionById
} from "../models/questionModel.js";

export async function create(req, res) {
  try {
    const organizationId = req.user.organization_id;
    const { questionText, options } = req.body;

    if (!questionText || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const question = await createQuestion({
      organizationId,
      questionText,
      options
    });

    res.json(question);
  } catch (err) {
    console.error("Create Question Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function list(req, res) {
  try {
    const organizationId = req.user.organization_id;
    const questions = await getQuestions(organizationId);
    res.json(questions);
  } catch (err) {
    console.error("List Questions Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function remove(req, res) {
  try {
    const organizationId = req.user.organization_id;
    const id = req.params.id;

    const existing = await getQuestionById(id, organizationId);
    if (!existing) return res.status(404).json({ error: "Question not found" });

    await deleteQuestion(id, organizationId);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Question Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
