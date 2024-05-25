import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { Order } from '../../models/orderModel.mjs';
import { User } from '../../models/userModel.mjs';
import { check, validationResult } from 'express-validator';
import db from '../../config/db.mjs';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};


export const createArtPublication = async (req, res) => {
  try {
    const userId = req.user.id; // From the token
    const user = await User.findById(userId);
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
    });

    const newPublication = new ArtPublication(newPublicationData);

    await newPublication.save();

    return res.json({
      msg: 'Art publication created successfully!',
      artPublication: {
        id: newPublication._id, // MongoDB generates _id
        userId: newPublication.userId,
        image: newPublication.image,
        artType: newPublication.artType,
        name: newPublication.name,
        description: newPublication.description,
        dimension: newPublication.dimension,
        isForSale: newPublication.isForSale,
        price: newPublication.price,
        location: newPublication.location,
      },
    });
  } catch (err) /* istanbul ignore next */ {
    if (err.name === 'ValidationError') {
      return res.status(422).json({ errors: Object.keys(err.errors).map(key => ({ msg: err.errors[key].message })) });
    }
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
};

export const deleteArtPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const artPublication = await ArtPublication.findById(id);

    if (!artPublication) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    if (artPublication.userId.toString() !== req.user.id) /* istanbul ignore next */ {
      return res.status(403).json({ msg: 'User not authorized to delete this publication' });
    }

    const pendingOrder = await Order.findOne({ artPublicationId: id, orderState: { $ne: 'completed' } });

    if (pendingOrder) {
      return res.status(400).json({ msg: 'Cannot delete publication with unfinished orders' });
    }

    await ArtPublication.deleteOne({ id: id });

    res.json({ msg: 'Art publication deleted successfully' });
  } catch (err) /* istanbul ignore next */ {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getArtPublicationById = async (req, res) => {
  try {
    const artPublicationId = req.params.id;
    const doc = await db.collection('ArtPublications').doc(artPublicationId).get();
    if (!doc.exists) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const artPublicationData = doc.data();
    const likes = [];
    for (const likeId of artPublicationData.likes) {
      const likeDoc = await db.collection('Likes').doc(likeId).get();
      if (likeDoc.exists) {
        likes.push({ id: likeId, ...likeDoc.data() });
      }
    }

    const comments = [];
    for (const commentId of artPublicationData.comments) {
      const commentDoc = await db.collection('Comments').doc(commentId).get();
      if (commentDoc.exists) {
        comments.push({ id: commentId, ...commentDoc.data() });
      }
    }

    const artPublication = {
      _id: doc.id,
      ...artPublicationData,
      likes,
      comments
    };

    res.json(artPublication);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};


export const getLatestArtPublications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const artPublications = await ArtPublication.findWithOrder({}, 'createdAt', 'desc', limit, skip);
    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getFollowedArtPublications = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const followedUsers = user.subscriptions;

    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const artPublications = await ArtPublication.findWithOrder({ userId: { $in: followedUsers } }, 'createdAt', 'desc', limit, skip);
    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Vérifiez si userId est valide (non vide)
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required' });
    }

    // Ajoutez des logs pour voir les valeurs des paramètres
    console.log(`Fetching art publications for user: ${userId}`);
    console.log(`Limit: ${limit}, Page: ${page}, Skip: ${skip}`);

    // Vérifiez si userId existe dans la base de données
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Requête pour obtenir les publications d'art
    const artPublications = await ArtPublication.findWithOrder({ userId }, 'createdAt', 'desc', limit, skip);

    // Vérifiez si des publications ont été trouvées
    if (!artPublications || artPublications.length === 0) {
      return res.status(404).json({ msg: 'No art publications found' });
    }

    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
