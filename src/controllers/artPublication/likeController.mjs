import { ArtPublication } from '../../models/ArtPublicationModel.mjs';
import { User } from '../../models/UserModel.mjs';

export const likeArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;

    const artPublication = await ArtPublication.findById(artPublicationId);
    const user = await User.findById(userId);
    
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    if (artPublication.likes.includes(userId)) {
      // Remove like from ArtPublication
      artPublication.likes.pull(userId);
      // Remove liked publication from User
      user.likedPublications.pull(artPublicationId);
    } else {
      // Add like to ArtPublication
      artPublication.likes.push(userId);
      // Add liked publication to User
      user.likedPublications.push(artPublicationId);
    }

    await artPublication.save();
    await user.save();

    res.json({ 
        msg: 'Like status updated',
        likeStatus: {
          artPublicationId,
          isLiked: artPublication.likes.includes(userId)
        }
      });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
