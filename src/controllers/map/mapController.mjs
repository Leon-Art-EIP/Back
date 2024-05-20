import { User } from "../../models/userModel.mjs";
import { ArtPublication } from '../../models/artPublicationModel.mjs';

export async function getUsersWithArtNearLocation(req, res) {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ msg: "Latitude, longitude, and radius are required" });
    }

    // Step 1: Find users within the specified radius
    const users = await User.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius) / 6378.1 // Radius in radians (divide distance by Earth's radius in km)
          ]
        }
      }
    }).select('_id username profilePicture location');

    console.log("users =", users);

    // Step 2: Filter users who have art publications
    const userIds = users.map(user => user._id);
    const usersWithArtPublications = await ArtPublication.find({ userId: { $in: userIds } })
                                                         .distinct('userId');
                                                         
    console.log("usersWithArtPublications =", usersWithArtPublications);

    const filteredUsers = users.filter(user => usersWithArtPublications.some(pubUserId => pubUserId.equals(user._id)));

    console.log("filteredUsers =", filteredUsers);

    // Step 3: Send back the necessary user details
    const result = filteredUsers.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture
    }));

    res.json(result);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
