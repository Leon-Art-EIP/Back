import express from 'express';
import { authenticate } from '../middleware/authenticate.mjs';
import { checkArticleAuthorization } from '../middleware/checkArticleAuthorization.mjs';
import { postArticle, getLatestArticles } from '../controllers/article/articleController.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/article:
 *   post:
 *     summary: Post a new article
 *     description: Allows an authenticated and authorized user to post a new article.
 *     tags: [Article]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the article.
 *               mainImage:
 *                 type: string
 *                 description: Main image URL for the article.
 *               content:
 *                 type: string
 *                 description: Rich-text content of the article (HTML).
 *     responses:
 *       200:
 *         description: Article posted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: User not authorized to post articles.
 *       500:
 *         description: Server error.
 */
router.post('/', authenticate, checkArticleAuthorization, postArticle);

/**
 * @swagger
 * /api/article/latest:
 *   get:
 *     summary: Fetch Latest Articles
 *     tags: [Article]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of articles to retrieve (default is 10).
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination.
 *         example: 2
 *     responses:
 *       200:
 *         description: Successful retrieval of articles.
 *       500:
 *         description: Server error.
 */
router.get('/latest', getLatestArticles);

export default router;
