import db from '../../config/db.mjs';
import geofire from 'geofire-common';
import { User } from '../../models/userModel.mjs';
import logger from '../../admin/logger.mjs';

export async function getUsersWithArtNearLocation(req, res) {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "Latitude, longitude, and radius are required" });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    // Calculate the bounds for geohashes
    const center = [lat, lon];
    const radiusInM = rad * 1000; // Convert radius to meters
    const bounds = geofire.geohashQueryBounds(center, radiusInM);

    // Step 1: Find users within the specified radius
    let users = [];
    for (const b of bounds) {
      const q = await db.collection('Users')
        .orderBy('geohash')
        .startAt(b[0])
        .endAt(b[1])
        .get();
      users = users.concat(q.docs.map(doc => new User({ ...doc.data(), id: doc.id })));
    }

    // Filter users within the radius
    users = users.filter(user => {
      const distance = geofire.distanceBetween([user.location.coordinates[1], user.location.coordinates[0]], center);
      return distance <= radiusInM;
    });

    logger.info("Users found within radius:", { users });

    // Step 2: Filter users who have art publications
    const userIds = users.map(user => user.id);

    // Vérifiez si userIds est vide avant d'exécuter la requête Firestore
    if (userIds.length === 0) {
      return res.json([]); // Retourne une réponse vide
    }

    // Récupérer les publications d'art pour les utilisateurs spécifiés
    const artPublicationsSnapshot = await db.collection('ArtPublications')
      .where('userId', 'in', userIds)
      .get();

    // Extraire les ID d'utilisateurs distincts des résultats
    const usersWithArtPublications = [];
    artPublicationsSnapshot.forEach(doc => {
      const artPublication = doc.data();
      if (!usersWithArtPublications.includes(artPublication.userId)) {
        usersWithArtPublications.push(artPublication.userId);
      }
    });

    logger.info("Users with art publications:", { usersWithArtPublications });

    const filteredUsers = users.filter(user => usersWithArtPublications.includes(user.id));

    logger.info("Filtered users:", { filteredUsers });

    // Step 3: Send back the necessary user details
    const result = filteredUsers.map(user => ({
      _id: user.id,
      username: user.username,
      profilePicture: user.profilePicture
    }));

    res.json(result);
  } catch (err) /* istanbul ignore next */ {
    logger.error('Error getting users with art near location:', { error: err.message });
    res.status(500).json({ msg: "Server Error" });
  }
}
