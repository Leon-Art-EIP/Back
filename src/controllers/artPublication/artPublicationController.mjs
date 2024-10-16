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
      name_lowercase: name.toLowerCase(),
      description,
      dimension,
      isForSale,
      price: price ? Number(price) : null,
      location,
      likes: [],
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
    logger.error('Error creating art publication', { error: err.message, stack: err.stack });
    return res.status(500).json({ msg: 'Server Error' });
  }
};


export const deleteArtPublication = async (req, res) => {
  try {
    const { _id } = req.params;

    const artPublicationDoc = await db.collection('ArtPublications').doc(_id).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const artPublication = artPublicationDoc.data();
    if (artPublication.userId !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to delete this publication' });
    }

    const pendingOrderSnapshot = await db.collection('Orders')
      .where('artPublicationId', '==', _id)
      .where('orderState', '!=', 'completed')
      .get();

    if (!pendingOrderSnapshot.empty) {
      return res.status(400).json({ msg: 'Cannot delete publication with unfinished orders' });
    }

    await db.runTransaction(async (transaction) => {
      const artPublicationRef = db.collection('ArtPublications').doc(_id);
      transaction.delete(artPublicationRef);

      const collectionsSnapshot = await db.collection('Collections').where('artPublications', 'array-contains', _id).get();  // Changed to _id
      collectionsSnapshot.forEach((collectionDoc) => {
        const collectionRef = db.collection('Collections').doc(collectionDoc.id);
        transaction.update(collectionRef, {
          artPublications: FieldValue.arrayRemove(_id)
        });
      });
    });

    logger.info('Art publication deleted successfully', { publicationId: _id });

    res.json({ msg: 'Art publication deleted successfully' });
  } catch (err) {
    logger.error('Error deleting art publication', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { _id } = req.params;

    const doc = await db.collection('ArtPublications').doc(_id).get();
    if (!doc.exists) {
      logger.info('Art publication not found', { _id });
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const artPublication = doc.data();
    artPublication._id = doc.id;
    const totalLikes = artPublication.likes ? artPublication.likes.length : 0;
    const isLiked = artPublication.likes.includes(userId); // Determine if the user has liked the publication

    res.json({
      ...artPublication,
      totalLikes,
      isLiked
    });
  } catch (err) {
    logger.error('Error retrieving art publication', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error', error: err.message });
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

    const artPublications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        _id: doc.id,
        createdAt: data.createdAt.toDate(), // Conversion de Firestore Timestamp en objet Date
      };
    });

    logger.info('Fetched latest art publications', { count: artPublications.length });

    res.json(artPublications);
  } catch (err) {
    logger.error('Error fetching latest art publications', { error: err.message, stack: err.stack });
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

    const artPublications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        _id: doc.id,
        createdAt: data.createdAt.toDate(),
      };
    });

    logger.info('Fetched followed art publications', { count: artPublications.length });

    res.json(artPublications);
  } catch (err) {
    logger.error('Error fetching followed art publications', { error: err.message, stack: err.stack });
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
    logger.error('Error fetching art publications by user', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationsImages = async (req, res) => {
  try {
    const artPublications = await db.collection('ArtPublications').get();
    const images = artPublications.docs.map(doc => doc.data().image);

    res.json(images);
  } catch (err) {
    logger.error('Error fetching art publications images', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
}
