import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { User } from '../../models/userModel.mjs';

export const searchArtworksAndArtists = async (req, res) => {
  try {
    const {
      searchTerm = '',
      artType,
      priceRange,
      isForSale,
      sort,
      page = 1,
      limit = process.env.DEFAULT_PAGE_LIMIT
    } = req.query;

    const query = {};
    if (searchTerm) /* istanbul ignore next */ {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'artist.name': { $regex: searchTerm, $options: 'i' } }
      ];
    }
    if (artType) query.artType = artType;
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      query.price = { $gte: minPrice, $lte: maxPrice };
    }
    if (isForSale !== undefined) query.isForSale = isForSale === 'true';

    const sortOptions = sort === 'popularity' ? { likes: -1 } : { createdAt: -1 };
    
    const artPublications = await ArtPublication.find(query).sort(sortOptions).limit(limit).skip((page - 1) * limit).populate('likes').populate('comments');
    const users = await User.find({ 'username': { $regex: searchTerm, $options: 'i' } }).limit(limit).skip((page - 1) * limit);

    res.json({ artPublications, users });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
