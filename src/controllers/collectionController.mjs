// controllers/CollectionController.mjs

import { User } from '../models/UserModel.mjs';
import { ArtPublication } from '../models/ArtPublicationModel.mjs';

export const addToCollection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { collectionName, artPublicationId } = req.body;

    const user = await User.findById(userId);
    const artPublication = await ArtPublication.findById(artPublicationId);

    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    let collection = user.collections.find(c => c.name === collectionName);

    if (!collection) {
      // Create new collection if not exist
      user.collections.push({ name: collectionName, artPublications: [artPublicationId] });
    } else {
      // Add to existing collection
      if (!collection.artPublications.includes(artPublicationId)) {
        collection.artPublications.push(artPublicationId);
      }
    }

    await user.save();

    res.json({ msg: 'Added to collection' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
