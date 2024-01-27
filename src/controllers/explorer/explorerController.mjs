import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { User } from '../../models/userModel.mjs';
import artTypes from '../../constants/artTypesData.js';

export const searchArtworksAndArtists = async (req, res) => {
  try {
    const {
      searchTerm = '',
      artType,
      priceRange,
      isForSale,
      sort,
      artPage = 1,
      artLimit = process.env.DEFAULT_PAGE_LIMIT,
      artistPage = 1,
      artistLimit = process.env.DEFAULT_PAGE_LIMIT
    } = req.query;

    const artTypes = req.query.artType ? req.query.artType.split(',') : [];

    const query = {};
    if (searchTerm) /* istanbul ignore next */ {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'artist.name': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    if (artTypes.length) query.artType = { $in: artTypes };
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      query.price = { $gte: minPrice, $lte: maxPrice };
    }
    if (isForSale !== undefined) query.isForSale = isForSale === 'true';

    const sortOptions = sort === 'popularity' ? { likes: -1 } : { createdAt: -1 };

    const artPublications = await ArtPublication.find(query).sort(sortOptions).limit(artLimit).skip((artPage - 1) * artLimit).populate('likes').populate('comments');
    const users = await User.find({ 'username': { $regex: searchTerm, $options: 'i' } }).limit(artistLimit).skip((artistPage - 1) * artistLimit);

    res.json({ artPublications, users });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtTypes = (req, res) => /* istanbul ignore next */ {
  res.json(artTypes);
};