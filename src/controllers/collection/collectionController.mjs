import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';
import { v4 as uuid } from 'uuid';
import { ArtPublication } from '../../models/artPublicationModel.mjs';
import Collection from '../../models/collectionModel.mjs';
import { User } from '../../models/userModel.mjs';
import logger from '../../admin/logger.mjs';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const addToCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collectionName, artPublicationId } = req.body;

    const artPublicationDoc = await db.collection('ArtPublications').doc(artPublicationId).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const collectionQuery = db.collection('Collections')
      .where('name', '==', collectionName)
      .where('userId', '==', userId)
      .limit(1);
    const collectionSnapshot = await collectionQuery.get();

    let collection;
    if (collectionSnapshot.empty) {
      const newCollectionData = {
        name: collectionName,
        artPublications: [artPublicationId],
        isPublic: true,
        userId,
        _id: uuid()
      };
      const collectionRef = db.collection('Collections').doc(newCollectionData._id);
      await collectionRef.set(newCollectionData);
      collection = new Collection(newCollectionData);
    } else {
      const doc = collectionSnapshot.docs[0];
      collection = new Collection({ ...doc.data(), _id: doc.id });
      if (!collection.artPublications.includes(artPublicationId)) {
        collection.artPublications.push(artPublicationId);
        const collectionRef = db.collection('Collections').doc(collection._id);
        await collectionRef.update({ artPublications: FieldValue.arrayUnion(artPublicationId) });
      }
    }

    const userDoc = await db.collection('Users').doc(userId).get();
    const user = new User({ ...userDoc.data(), _id: userDoc.id });
    if (!user.collections.includes(collection._id)) {
      user.collections.push(collection._id);
      await db.collection('Users').doc(userId).update({ collections: FieldValue.arrayUnion(collection._id) });
    }

    res.json({
      msg: "Added to collection",
      collection: collection.toJSON(),
    });
  } catch (err) {
    logger.error('Error adding to collection:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getMyCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionsSnapshot = await db.collection('Collections').where('userId', '==', userId).get();
    const collections = collectionsSnapshot.docs.map(doc => new Collection({ ...doc.data(), _id: doc.id }).toJSON());

    res.json(collections);
  } catch (err) {
    logger.error('Error getting my collections:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getPublicCollections = async (req, res) => {
  try {
    const userId = req.params.userId;
    const collectionsSnapshot = await db.collection('Collections')
      .where('userId', '==', userId)
      .where('isPublic', '==', true)
      .get();
    const collections = collectionsSnapshot.docs.map(doc => new Collection({ ...doc.data(), _id: doc.id }).toJSON());

    res.json(collections);
  } catch (err) {
    logger.error('Error getting public collections:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getArtPublicationsInCollection = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    const collectionDoc = await db.collection('Collections').doc(collectionId).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    const collection = new Collection({ ...collectionDoc.data(), _id: collectionDoc.id });

    // Check if there are any art publications in the collection
    if (collection.artPublications.length === 0) {
      return res.json([]); // Return an empty array immediately if no art publications are associated
    }

    const artPublicationsSnapshot = await db.collection('ArtPublications')
      .where('_id', 'in', collection.artPublications)
      .get();
    const artPublications = artPublicationsSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    res.json(artPublications);
  } catch (err) {
    logger.error('Error getting art publications in collection:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};


export const deleteCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.collectionId;

    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const collectionDoc = await db.collection('Collections').doc(collectionId).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    await db.collection('Collections').doc(collectionId).delete();
    await db.collection('Users').doc(userId).update({
      collections: FieldValue.arrayRemove(collectionId)
    });

    res.json({ msg: 'Collection deleted' });
  } catch (err) {
    logger.error('Error deleting collection:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const removeFromCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.collectionId;
    const { artPublicationIds } = req.body;

    const collectionDoc = await db.collection('Collections').doc(collectionId).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    const collection = new Collection({ ...collectionDoc.data(), _id: collectionDoc.id });
    collection.artPublications = collection.artPublications.filter(
      (id) => !artPublicationIds.includes(id)
    );

    await db.collection('Collections').doc(collection._id).update({ artPublications: collection.artPublications });

    res.json({ msg: "Art publications removed from collection", collection: collection.toJSON() });
  } catch (err) {
    logger.error('Error removing from collection:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
