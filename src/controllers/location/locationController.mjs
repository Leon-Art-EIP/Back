import db from '../../config/db.mjs';

export async function updateUserLocation(req, res) {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // Validate the location data
    if (!latitude || !longitude) /* istanbul ignore next */ {
      return res.status(400).json({ msg: "Latitude and longitude are required" });
    }

    // Update the user's location
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const userRef = db.collection('Users').doc(userId);
    await userRef.update({ location });

    res.status(200).json({ msg: "Location updated successfully" });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
