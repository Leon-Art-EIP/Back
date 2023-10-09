import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { User } from '../../models/userModel.mjs';

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

export const getArtPublicationById = async (req, res) => {
  try {
    const artPublication = await ArtPublication.findById(req.params.id).populate('likes').populate('comments');
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    res.json(artPublication);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getLatestArtPublications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const artPublications = await ArtPublication.find().sort({ _id: -1 }).limit(limit).skip((page - 1) * limit).populate('likes').populate('comments');
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

    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const artPublications = await ArtPublication.find({ userId: { $in: followedUsers } }).sort({ _id: -1 }).limit(limit).skip((page - 1) * limit);
    res.json(artPublications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
