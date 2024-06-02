import { User } from "../../models/userModel.mjs";
import Collection from "../../models/collectionModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { FieldValue } from 'firebase-admin/firestore';

export const addToCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collectionName, artPublicationId } = req.body;

    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication) {
      return res.status(404).json({ msg: "Art publication not found" });
    }

    // Create or update collection
    let collection = await Collection.findOneAndUpdate(
      { name: collectionName, userId: userId },
      { artPublications: FieldValue.arrayUnion(artPublicationId) },
      { upsert: true }
    );

    // Update user's collections
    const user = await User.findById(userId);
    if (!user.collections.includes(collection._id)) {
      user.collections.push(collection._id);
      await user.update({ collections: user.collections });
    }

    res.json({
      msg: "Added to collection",
      collection: collection,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error('Error adding to collection:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getMyCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCollections = await Collection.find({ userId: userId });

    // Ajoutez l'ID du document Firestore comme _id dans chaque collection
    const collectionsWithId = userCollections.map(collection => {
      return {
        ...collection,
        _id: collection._id || collection.id
      };
    });

    console.log('User collections:', collectionsWithId);
    res.json(collectionsWithId);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};


export const getPublicCollections = async (req, res) => {
  try {
    const userId = req.params.userId;
    const publicCollections = await Collection.find({ userId: userId, isPublic: true });

    // Ajoutez l'ID du document Firestore comme _id dans chaque collection
    const collectionsWithId = publicCollections.map(collection => {
      return {
        ...collection,
        _id: collection._id || collection.id
      };
    });

    console.log('Public collections:', collectionsWithId);
    res.json(collectionsWithId);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};


export const getArtPublicationsInCollection = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    console.log('Collection ID:', collectionId);
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    console.log('Found collection:', collection);

    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Vérifiez que les artPublications existent
    console.log('ArtPublications in collection:', collection.artPublications);

    if (collection.artPublications.length === 0) {
      return res.status(404).json({ msg: "No art publications found in this collection" });
    }

    // Nouvelle méthode pour récupérer les ArtPublications en utilisant array-contains-any
    const artPublications = await ArtPublication.findWithArrayContainsAny(
      '_id',
      collection.artPublications,
      'createdAt',
      'desc',
      limit,
      offset
    );

    console.log('Found artPublications:', artPublications);

    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error('Server Error:', err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};





export const deleteCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.collectionId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ msg: 'Collection not found' });
    }

    await Collection.findByIdAndDelete(collectionId); // Delete collection document

    await User.findByIdAndUpdate(userId, {
      $pull: { collections: collectionId }
    });

    return res.json({ msg: 'Collection deleted' });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
};

export const removeFromCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    // Retrieve collectionId from URL parameters
    const collectionId = req.params.collectionId;
    const { artPublicationIds } = req.body; // Array of art publication IDs

    const collection = await Collection.findOne({ _id: collectionId, user: userId });
    if (!collection) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    // Remove art publications from the collection
    collection.artPublications = collection.artPublications.filter(
      (id) => !artPublicationIds.includes(id.toString())
    );

    await collection.save();

    res.json({ msg: "Art publications removed from collection", collection });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
