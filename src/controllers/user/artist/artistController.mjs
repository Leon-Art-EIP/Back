import { User } from "../../../models/userModel.mjs";
import db from '../../../config/db.mjs';

export const getLatestArtists = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Créez la requête pour obtenir les artistes
    let query = db.collection('Users')
      .where('is_artist', '==', true)
      .orderBy('createdAt', 'desc')
      .offset(skip)
      .limit(limit);

    // Exécutez la requête
    const querySnapshot = await query.get();
    const artists = [];

    // Transformez les résultats en instances de `User`
    querySnapshot.forEach((doc) => {
      const artist = new User(doc.data());
      artist.id = doc.id;
      delete artist.password; // Supprimez les informations sensibles
      artists.push(artist);
    });

    return res.json({ artists });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};