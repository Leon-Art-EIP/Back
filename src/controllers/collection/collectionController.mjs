import { User } from "../../models/userModel.mjs";
import Collection from "../../models/collectionModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";

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
      { name: collectionName, user: userId },
      { $addToSet: { artPublications: artPublicationId } },
      { new: true, upsert: true }
    );

    // Update user's collections
    const user = await User.findById(userId);
    if (!user.collections.includes(collection._id)) {
      user.collections.push(collection._id);
      await user.save();
    }

    res.json({
      msg: "Added to collection",
      collection: collection,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getMyCollections = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCollections = await Collection.find({ user: userId }); // Directly find by user reference
    res.json(userCollections);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getPublicCollections = async (req, res) => {
  try {
    const userId = req.params.userId;
    const publicCollections = await Collection.find({ user: userId, isPublic: true });
    res.json(publicCollections);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getArtPublicationsInCollection = async (req, res) => {
  try {
    const collectionId = req.params.collectionId;
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const artPublications = await ArtPublication.findWithOrder(
      { _id: { $in: collection.artPublications } },
      'createdAt',
      'desc',
      limit,
      offset
    );

    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
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
