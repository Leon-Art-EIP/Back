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
