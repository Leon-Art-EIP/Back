import { Article } from "../../models/articleModel.mjs";

export const postArticle = async (req, res) => {
  try {
    const { title, mainImage, content } = req.body;
    const userId = req.user.id;

    const article = new Article({
      title,
      mainImage,
      content,
      author: userId
    });

    await article.save();
    res.status(201).json(article);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestArticles = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const articles = await Article.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username'); // Populating author's username

    res.json(articles);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};