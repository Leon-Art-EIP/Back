import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { User } from "../../models/userModel.mjs";
import Collection from "../../models/collectionModel.mjs";

export const getArtPublications = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).populate('likedPublications');
    const userCollections = await Collection.find({ user: userId }).populate({
      path: 'artPublications',
      select: 'artType'
    });

    let typesDart = [];

    // Collecter les types d'art des publications aimées
    user.likedPublications.forEach(pub => {
      typesDart.push(pub.artType);
    });

    // Collecter les types d'art des publications dans les collections
    userCollections.forEach(collection => {
      collection.artPublications.forEach(pub => {
        typesDart.push(pub.artType);
      });
    });

    // Calculer la fréquence de chaque type d'art
    const typeFrequency = typesDart.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Trouver le type d'art le plus récurrent
    let mostCommonType = null;
    let maxCount = 0;

    for (let type in typeFrequency) {
      if (typeFrequency[type] > maxCount) {
        mostCommonType = type;
        maxCount = typeFrequency[type];
      }
    }

    let artPublications;

    // Si un type d'art récurrent est trouvé, rechercher des publications similaires
    if (mostCommonType) {
      artPublications = await ArtPublication
        .find({ artType: mostCommonType })
        .sort({ createdAt: -1 })
        .populate('likes')
        .populate('comments');
    } else {
      // Sinon, retourner des publications aléatoires ou populaires
      artPublications = await ArtPublication
        .find()
        .sort({ createdAt: -1 })
        .populate('likes')
        .populate('comments');
    }

    res.json({ foryou: artPublications });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
