import { Article } from "../../models/articleModel.mjs";
import { User } from "../../models/userModel.mjs";

export const postArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const mainImage = req.file ? req.file.path : null; // Get the path of the uploaded image

    const maxPosition = await Article.getMaxPosition();
    const position = maxPosition + 1;

    const article = new Article({
      title,
      mainImage,
      content,
      authorId: userId, // Utilisez `authorId` au lieu de `author`
      position
    });

    await article.save();

    const author = await User.findById(userId);

    res.status(201).json({
      _id: article._id,
      title: article.title,
      mainImage: article.mainImage,
      content: article.content,
      author: {
        username: author.username
      },
      createdAt: article.createdAt,
      position: article.position
    });
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

    res.json({
      _id: article._id,
      title: article.title,
      mainImage: article.mainImage,
      content: article.content,
      author: {
        username: author.username
      },
      createdAt: article.createdAt,
      position: article.position
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestArticles = async (req, res) => {
  try {
    const articles = await Article.findWithOrder({}, 'createdAt', 'desc');
    const result = await Promise.all(articles.map(async article => {
      const author = await User.findById(article.authorId);
      return {
        _id: article._id,
        title: article.title,
        mainImage: article.mainImage,
        content: article.content,
        author: {
          username: author.username
        },
        createdAt: article.createdAt,
        position: article.position
      };
    }));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
