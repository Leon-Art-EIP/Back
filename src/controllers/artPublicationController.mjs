import { ArtPublication } from '../models/ArtPublicationModel.mjs';

export const createArtPublication = async (req, res) => {
  try {
    const userId = req.user.id; // From the token
    const {
      image,
      artType,
      name,
      description,
      dimension,
      isForSale,
      price,
      location
    } = req.body;

    const newPublication = new ArtPublication({
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

    await newPublication.save();

    return res.json({ msg: 'Art publication created successfully!' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
};
