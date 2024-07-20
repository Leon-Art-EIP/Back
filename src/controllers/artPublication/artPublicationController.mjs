import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { User } from '../../models/userModel.mjs';
import { Order } from '../../models/orderModel.mjs';
import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const createArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      image = req.file?.path,
      artType,
      name,
      description,
      dimension,
      isForSale,
      price,
      location
    } = req.body;

    const newPublicationData = cleanUndefinedFields({
      userId,
      image,
      artType,
      name,
      description,
      dimension,
      isForSale,
      price,
      location,
      createdAt: new Date(),
      _id: uuidv4(),
    });

    const artPublicationRef = db.collection('ArtPublications').doc(newPublicationData._id);
    await artPublicationRef.set(newPublicationData);

    logger.info('Art publication created successfully', { artPublication: newPublicationData });

    res.json({
      msg: 'Art publication created successfully!',
      artPublication: newPublicationData,
    });
  } catch (err) {
    logger.error('Error creating art publication', { error: err.message });
    return res.status(500).json({ msg: 'Server Error' });
  }
};

export const deleteArtPublication = async (req, res) => {
  try {
    const { id } = req.params;

    const artPublicationDoc = await db.collection('ArtPublications').doc(id).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const artPublication = artPublicationDoc.data();
    if (artPublication.userId !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to delete this publication' });
    }

    const pendingOrder = await Order.findOne({ artPublicationId: id, orderState: { $ne: 'completed' } });
    if (pendingOrder) {
      return res.status(400).json({ msg: 'Cannot delete publication with unfinished orders' });
    }

    await db.runTransaction(async (transaction) => {
      const artPublicationRef = db.collection('ArtPublications').doc(id);
      transaction.delete(artPublicationRef);

      const collectionsSnapshot = await db.collection('Collections').where('artPublications', 'array-contains', id).get();
      collectionsSnapshot.forEach((collectionDoc) => {
        const collectionRef = db.collection('Collections').doc(collectionDoc.id);
        transaction.update(collectionRef, {
          artPublications: FieldValue.arrayRemove(id)
        });
      });
    });

    logger.info('Art publication deleted successfully', { publicationId: id });

    res.json({ msg: 'Art publication deleted successfully' });
  } catch (err) {
    logger.error('Error deleting art publication', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('ArtPublications').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const artPublication = { ...doc.data(), _id: doc.id };
    const likes = await Promise.all(
      artPublication.likes.map(async userId => {
        const userDoc = await db.collection('Users').doc(userId).get();
        return userDoc.exists ? { _id: userDoc.id, ...userDoc.data() } : null;
      })
    ).then(results => results.filter(result => result !== null));

    const comments = await Promise.all(
      artPublication.comments.map(async commentId => {
        const commentDoc = await db.collection('Comments').doc(commentId).get();
        return commentDoc.exists ? { id: commentId, ...commentDoc.data() } : null;
      })
    ).then(results => results.filter(result => result !== null));

    logger.info('Fetched art publication by id', { publicationId: id });

    res.json({
      ...artPublication,
      likes,
      comments
    });
  } catch (err) {
    logger.error('Error fetching art publication by id', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getLatestArtPublications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const querySnapshot = await db.collection('ArtPublications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const artPublications = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    logger.info('Fetched latest art publications', { count: artPublications.length });

    res.json(artPublications);
  } catch (err) {
    logger.error('Error fetching latest art publications', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getFollowedArtPublications = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.collection('Users').doc(userId).get();
    const followedUsers = user.data().subscriptions;

    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const querySnapshot = await db.collection('ArtPublications')
      .where('userId', 'in', followedUsers)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const artPublications = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    logger.info('Fetched followed art publications', { count: artPublications.length });

    res.json(artPublications);
  } catch (err) {
    logger.error('Error fetching followed art publications', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const querySnapshot = await db.collection('ArtPublications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const artPublications = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    logger.info('Fetched art publications by user', { userId, count: artPublications.length });

    res.json(artPublications);
  } catch (err) {
    logger.error('Error fetching art publications by user', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};
