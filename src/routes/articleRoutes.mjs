import express from 'express';
import { authenticate } from '../middleware/authenticate.mjs';
import { checkArticleAuthorization } from '../middleware/checkArticleAuthorization.mjs';
import { postArticle, getLatestArticles } from '../controllers/article/articleController.mjs';
import { validateArticle } from '../middleware/validation/articleValidation.mjs';
import { uploadArticleImage } from "../middleware/uploadMiddleware.mjs";

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the article.
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Main image file for the article.
 *               content:
 *                 type: string
 *                 description: Rich-text content of the article (HTML).
 *     responses:
 *       '201':
 *         description: Article posted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 mainImage:
 *                   type: string
 *                 content:
 *                   type: string
 *                 author:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: User not authorized to post articles.
 *       '500':
 *         description: Server error.
 */
router.post(
    '/',
    authenticate,
    uploadArticleImage,
    checkArticleAuthorization,
    validateArticle,
    postArticle
  );

/**
 * @swagger
 * /api/article/latest:
 *   get:
 *     summary: Fetch Latest Articles
 *     description: Retrieve the latest articles posted on the platform.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   mainImage:
 *                     type: string
 *                   content:
 *                     type: string
 *                   author:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                   createdAt:
 *                     type: date
 *       500:
 *         description: Server error.
 */
router.get('/latest', getLatestArticles);

export default router;
