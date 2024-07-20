import { Quizz } from "../../models/quizzModel.mjs";
import { User } from "../../models/userModel.mjs";
import db from "../../config/db.mjs";
import logger from "../../admin/logger.mjs";

export async function submitQuizz(req, res) {
  try {
    const userId = req.user.id;
    const quizzData = req.body;

    quizzData.userId = userId;

    const quizz = new Quizz(quizzData);
    const quizzRef = db.collection('Quizzes').doc();
    await quizzRef.set(quizz.toJSON());
    const quizzId = quizzRef.id;

    await db.collection('Users').doc(userId).update({
      quizz: quizzId,
      location: quizzData.location
    });

    res.status(200).json({ msg: "Quizz submitted successfully" });
  } catch (err) {
    logger.error('Error submitting quizz:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function getQuizzById(req, res) {
  try {
    const quizzId = req.params.id;
    const quizzRef = db.collection('Quizzes').doc(quizzId);
    const doc = await quizzRef.get();
    if (!doc.exists) {
      return res.status(404).json({ msg: "Quizz not found" });
    }
    res.json(doc.data());
  } catch (err) {
    logger.error('Error getting quizz by id:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function updateQuizz(req, res) {
  try {
    const quizzId = req.params.id;
    const updateData = req.body;
    await db.collection('Quizzes').doc(quizzId).update(updateData);
    res.status(200).json({ msg: "Quizz updated successfully" });
  } catch (err) {
    logger.error('Error updating quizz:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function deleteQuizz(req, res) {
  try {
    const quizzId = req.params.id;
    await db.collection('Quizzes').doc(quizzId).delete();
    res.status(200).json({ msg: "Quizz deleted successfully" });
  } catch (err) {
    logger.error('Error deleting quizz:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
