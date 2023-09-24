import { ArtPublication } from '../models/ArtPublicationModel.mjs';

export const likeArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;

    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    if (artPublication.likes.includes(userId)) {
      // Remove like
      artPublication.likes.pull(userId);
    } else {
      // Add like
      artPublication.likes.push(userId);
    }

    await artPublication.save();

    res.json({ msg: 'Like status updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
