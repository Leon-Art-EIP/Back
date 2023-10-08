import { User } from "../../models/UserModel.mjs";
import { ArtPublication } from "../../models/ArtPublicationModel.mjs";

export const addToCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collectionName, artPublicationId } = req.body;
    const user = await User.findById(userId);
    const artPublication = await ArtPublication.findById(artPublicationId);

    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    let collection = user.collections.find((c) => c.name === collectionName);

    if (!collection) {
      // Create new collection if not exist
      user.collections.push({
        name: collectionName,
        artPublications: [artPublicationId],
        isPublic: req.body.isPublic || true // Default to public if not specified
      });
    } else {
      // Add to existing collection
      if (!collection.artPublications.includes(artPublicationId)) {
        collection.artPublications.push(artPublicationId);
      }
    }

    await user.save();

    res.json({
      msg: "Added to collection",
      collection: {
        name: collectionName,
        artPublications: collection
          ? collection.artPublications
          : [artPublicationId],
      },
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getUserCollections = async (req, res) => {
  try {
    console.log("potato");
    const userId = req.user.id;
    const user = await User.findById(userId).select('collections');
    res.json(user.collections);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getPublicCollections = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select('collections');
    const publicCollections = user.collections.filter(collection => collection.isPublic);
    res.json(publicCollections);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtPublicationsInCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.collectionId;

    const user = await User.findById(userId);

    const collection = user.collections.id(collectionId);

    if (!collection) return res.status(404).json({ msg: 'Collection not found' });

    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    const artPublications = await ArtPublication.find({
      _id: { $in: collection.artPublications }
    }).limit(limit).skip(skip);
    

    res.json(artPublications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const collectionId = req.params.collectionId;

    const user = await User.findById(userId);

    user.collections.id(collectionId).remove();
    await user.save();

    res.json({ msg: 'Collection deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
