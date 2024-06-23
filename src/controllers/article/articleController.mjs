import { Article } from "../../models/articleModel.mjs";
import { User } from "../../models/userModel.mjs";
import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';

export const postArticle = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const mainImage = req.file ? req.file.path : null;

    const maxPositionSnapshot = await db.collection('Articles').orderBy('position', 'desc').limit(1).get();
    const maxPosition = maxPositionSnapshot.empty ? 0 : maxPositionSnapshot.docs[0].data().position;
    const position = maxPosition + 1;

    const articleData = {
      title,
      mainImage,
      content,
      authorId: userId,
      createdAt: new Date().toISOString(),
      position
    };

    const articleRef = db.collection('Articles').doc();
    await articleRef.set(articleData);
    const articleId = articleRef.id;

    const author = await User.findById(userId);

    logger.info(`Article created: ${articleId} by user: ${userId}`);

    res.status(201).json({
      _id: articleId,
      ...articleData,
      author: {
        username: author.username
      }
    });
  } catch (err) {
    logger.error('Error posting article', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('Articles').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ msg: 'Article not found' });
    }

    const article = { ...doc.data(), _id: doc.id };
    const author = await User.findById(article.authorId);

    logger.info(`Fetched article: ${id}`);

    res.json({
      ...article,
      author: {
        username: author.username
      }
    });
  } catch (err) {
    logger.error('Error getting article by ID', err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestArticles = async (req, res) => {
  try {
    const querySnapshot = await db.collection('Articles').orderBy('createdAt', 'desc').get();
    const articles = querySnapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id }));

    const result = await Promise.all(articles.map(async article => {
      const author = await User.findById(article.authorId);
      return {
        ...article,
        author: {
          username: author.username
        }
      };
    }));

    logger.info('Fetched latest articles');

    res.json(result);
  } catch (err) {
    logger.error('Error getting latest articles', err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const articleRef = db.collection('Articles').doc(id);
    await articleRef.update({
      ...updateData,
      updatedAt: new Date().toISOString()
    });

    const updatedArticle = await articleRef.get();

    logger.info(`Article updated: ${id}`);

    res.json({
      _id: id,
      ...updatedArticle.data()
    });
  } catch (err) {
    logger.error('Error updating article', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('Articles').doc(id).delete();

    logger.info(`Article deleted: ${id}`);

    res.status(204).send();
  } catch (err) {
    logger.error('Error deleting article', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
