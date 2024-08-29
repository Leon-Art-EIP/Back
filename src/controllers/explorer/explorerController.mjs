import db from '../../config/db.mjs';
import artTypes from '../../constants/artTypesData.js';
import logger from '../../admin/logger.mjs';

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

    const artTypesArray = artType ? artType.split(',') : [];
    const lowercaseSearchTerm = searchTerm.toLowerCase();

    let artQuery = db.collection('ArtPublications');
    if (searchTerm) {
      artQuery = artQuery.where('name_lowercase', '>=', lowercaseSearchTerm).where('name_lowercase', '<=', lowercaseSearchTerm + '\uf8ff');
    }
    if (artTypesArray.length) {
      artQuery = artQuery.where('artType', 'in', artTypesArray);
    }
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      artQuery = artQuery.where('price', '>=', minPrice).where('price', '<=', maxPrice);
    }
    if (isForSale !== undefined) {
      artQuery = artQuery.where('isForSale', '==', isForSale === 'true');
    }

    const sortOptions = sort === 'popularity' ? 'likes' : 'createdAt';
    const orderDirection = 'desc';

    artQuery = artQuery.orderBy(sortOptions, orderDirection)
      .limit(Number(artLimit))
      .offset((artPage - 1) * artLimit);

    const artSnapshot = await artQuery.get();
    const artPublications = artSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let userQuery = db.collection('Users');
    if (searchTerm) {
      userQuery = userQuery.where('username_lowercase', '>=', lowercaseSearchTerm).where('username_lowercase', '<=', lowercaseSearchTerm + '\uf8ff');
    }
    userQuery = userQuery.limit(Number(artistLimit))
      .offset((artistPage - 1) * artistLimit);

    const userSnapshot = await userQuery.get();
    const users = userSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    res.json({ artPublications, users });
  } catch (err) {
    logger.error('Error searching artworks and artists:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};



export const getArtTypes = (req, res) => {
  res.json(artTypes);
};
