import { ArtPublication } from '../../models/artPublicationModel.mjs';
import { User } from '../../models/userModel.mjs';
import artTypes from '../../constants/artTypesData.js';
import db from '../../config/db.mjs';

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

    let artQuery = db.collection('ArtPublications');
    if (searchTerm) {
      artQuery = artQuery.where('name', '>=', searchTerm).where('name', '<=', searchTerm + '\uf8ff');
    }
    if (artTypes.length) {
      artQuery = artQuery.where('artType', 'in', artTypes);
    }
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split('-').map(Number);
      artQuery = artQuery.where('price', '>=', minPrice).where('price', '<=', maxPrice);
    }
    if (isForSale !== undefined) {
      artQuery = artQuery.where('isForSale', '==', isForSale === 'true');
    }

    const sortOptions = sort === 'popularity' ? 'likes' : 'createdAt';
    const orderDirection = sort === 'popularity' ? 'desc' : 'desc';

    artQuery = artQuery.orderBy(sortOptions, orderDirection)
      .limit(Number(artLimit))
      .offset((artPage - 1) * artLimit);

    const artSnapshot = await artQuery.get();
    const artPublications = artSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let userQuery = db.collection('Users').where('username', '>=', searchTerm).where('username', '<=', searchTerm + '\uf8ff')
      .limit(Number(artistLimit))
      .offset((artistPage - 1) * artistLimit);

    const userSnapshot = await userQuery.get();
    const users = userSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    res.json({ artPublications, users });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArtTypes = (req, res) => /* istanbul ignore next */ {
  res.json(artTypes);
};