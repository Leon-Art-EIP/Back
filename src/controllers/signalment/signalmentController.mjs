import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../admin/logger.mjs';

const infractions = [
  "AI-generated Art",
  "Spam",
  "Intellectual Property Violation",
  "Not Art",
  "Hate Speech or Symbols",
  "Other"
];

export const getInfractions = (req, res) => {
  try {
    res.json(infractions);
  } catch (err) {
    logger.error('Error fetching infractions list:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};

export const signalUser = async (req, res) => {
  try {
    const { userId, infraction, message } = req.body;
    const signalment = {
      id: uuidv4(),
      userId,
      infraction,
      message,
      createdAt: new Date().toISOString()
    };

    await db.collection('UserSignalments').doc(signalment.id).set(signalment);
    logger.info('User signalment created successfully', { signalment });

    res.json({ msg: 'User signalment created successfully!' });
  } catch (err) {
    logger.error('Error creating user signalment:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};

export const signalArtPublication = async (req, res) => {
  try {
    const { artPublicationId, infraction, message } = req.body;
    const signalment = {
      id: uuidv4(),
      artPublicationId,
      infraction,
      message,
      createdAt: new Date().toISOString()
    };

    await db.collection('ArtPublicationSignalments').doc(signalment.id).set(signalment);
    logger.info('Art publication signalment created successfully', { signalment });

    res.json({ msg: 'Art publication signalment created successfully!' });
  } catch (err) {
    logger.error('Error creating art publication signalment:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};
