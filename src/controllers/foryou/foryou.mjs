import { ArtPublication } from "../../models/artPublicationModel.mjs";

export const getArtPublications = async (req, res) => {
  try {
    const artPublications = await ArtPublication.find().sort({ createdAt: -1 }).populate('likes').populate('comments');
    res.json(artPublications);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};