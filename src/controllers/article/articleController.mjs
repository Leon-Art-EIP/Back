import { Article } from "../../models/articleModel.mjs";
import { User } from "../../models/userModel.mjs";

export const postArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const mainImage = req.file ? req.file.path : null; // Get the path of the uploaded image

    const article = new Article({
      title,
      mainImage,
      content,
      authorId: userId, // Utilisez `authorId` au lieu de `author`
    });

    await article.save();
    res.status(201).json({ ...article, _id: article._id }); // Inclure _id dans la réponse
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'article par son ID depuis Firestore
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ msg: 'Article not found' });
    }

    // Récupérer l'auteur de l'article
    const author = await User.findById(article.authorId);

    if (author) {
      // Inclure les informations de l'auteur dans la réponse
      article.author = {
        username: author.username
      };
    }

    res.json({ ...article, _id: article._id }); // Inclure _id dans la réponse
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestArticles = async (req, res) => {
  try {
    const articles = await Article.findWithOrder({}, 'createdAt', 'desc');
    res.json(articles.map(article => ({ ...article, _id: article._id }))); // Inclure _id dans chaque article
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
