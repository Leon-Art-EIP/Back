// src/routes/explorerRoutes.mjs

import express from 'express';
import { authenticate } from "../middleware/authenticate.mjs";
import { searchArtworksAndArtists } from '../controllers/explorer/explorerController.mjs';
import { validateSearch } from '../middleware/validation/searchValidation.mjs';

const router = express.Router();
/**
 * @swagger
 * /api/explorer/search:
 *   get:
 *     summary: Search for Art Publications and Artists
 *     description: |
 *       Allows users to search for art publications and artists based on various criteria.
 *       Users can filter the search by the title of the artwork, the artist's name, the type of art,
 *       a price range, and sale status. Additionally, the results can be sorted by popularity or recency.
 *       Separate pagination controls are provided for artworks and artists.
 *     tags: [Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         required: false
 *         schema:
 *           type: string
 *         description: The search term to look for in titles, artist names, etc.
 *       - in: query
 *         name: artType
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by the type of art.
 *       - in: query
 *         name: priceRange
 *         required: false
 *         schema:
 *           type: string
 *         description: A price range to filter the artworks, formatted as "min-max".
 *       - in: query
 *         name: isForSale
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Whether to filter artworks that are currently for sale.
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum: [popularity, recent]
 *         description: Sorting criteria, either by popularity or recency.
 *       - in: query
 *         name: artPage
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination of artworks.
 *       - in: query
 *         name: artLimit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of artworks per page.
 *       - in: query
 *         name: artistPage
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination of artists.
 *       - in: query
 *         name: artistLimit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of artists per page.
 *     responses:
 *       200:
 *         description: Successful retrieval of search results.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artPublications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       artType:
 *                         type: string
 *                       image:
 *                         type: string
 *                       price:
 *                         type: number
 *                       isForSale:
 *                         type: boolean
 *                       description:
 *                         type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *       400:
 *         description: Bad request, invalid query parameters.
 *       401:
 *         description: Unauthorized access, no valid token provided.
 *       422:
 *         description: Validation error, incorrect query format.
 *       500:
 *         description: Server error.
 */
router.get('/search', authenticate, validateSearch, searchArtworksAndArtists);

export default router;
