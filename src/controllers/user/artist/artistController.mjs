import db from '../../../config/db.mjs';
import logger from '../../../admin/logger.mjs';

export const getLatestArtists = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    logger.info(`Fetching latest artists with limit: ${limit}, page: ${page}`);

    // Créez la requête pour obtenir les artistes
    let query = db.collection('Users')
      .where('is_artist', '==', true)
      .offset(skip)
      .limit(limit);

    // Exécutez la requête
    const querySnapshot = await query.get();
    const artists = [];

    // Transformez les résultats en objets avec les champs nécessaires
    querySnapshot.forEach((doc) => {
      const artistData = doc.data();
      const artist = {
        ...artistData,
        _id: doc.id,
      };
      delete artist.password; // Supprimez les informations sensibles
      artists.push(artist);
    });

    logger.info(`Fetched ${artists.length} artists`);

    res.json({ artists });
  } catch (err) /* istanbul ignore next */ {
    logger.error('Error fetching artists:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
