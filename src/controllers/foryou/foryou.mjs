import db from '../../config/db.mjs';

export const getArtPublications = async (req, res) => {
  const userId = req.user.id;

  try {
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const user = userDoc.data();

    const likedPublications = await db.collection('ArtPublications')
      .where('__name__', 'in', user.likedPublications)
      .get();

    const userCollectionsSnapshot = await db.collection('Collections')
      .where('userId', '==', userId)
      .get();

    let typesDart = [];

    // Collecter les types d'art des publications aimées
    likedPublications.forEach(pub => {
      typesDart.push(pub.data().artType);
    });

    // Collecter les types d'art des publications dans les collections
    userCollectionsSnapshot.forEach(collectionDoc => {
      const collection = collectionDoc.data();
      collection.artPublications.forEach(async (pubId) => {
        const pubDoc = await db.collection('ArtPublications').doc(pubId).get();
        if (pubDoc.exists) {
          typesDart.push(pubDoc.data().artType);
        }
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

    let artQuery = db.collection('ArtPublications').orderBy('createdAt', 'desc');

    // Si un type d'art récurrent est trouvé, rechercher des publications similaires
    if (mostCommonType) {
      artQuery = artQuery.where('artType', '==', mostCommonType);
    }

    const artSnapshot = await artQuery.get();
    const artPublications = artSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ foryou: artPublications });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
