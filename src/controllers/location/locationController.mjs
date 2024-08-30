import db from '../../config/db.mjs';
import geofire from 'geofire-common';
import logger from '../../admin/logger.mjs';

export async function updateUserLocation(req, res) {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ msg: "Latitude and longitude are required" });
    }

    // Calculate the geohash for the given location
    const geohash = geofire.geohashForLocation([latitude, longitude]);

    // Update the user's location with geohash
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
      geohash: geohash, // Make sure the geohash is stored here
    };

    const userRef = db.collection('Users').doc(userId);
    await userRef.update({ location });

    res.status(200).json({ msg: "Location updated successfully" });
  } catch (err) {
    logger.error('Error updating user location:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
}
