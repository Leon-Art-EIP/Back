import express from 'express';
const router = express.Router();
import { authenticate } from "../middleware/authenticate.mjs";
import { createArtPublication } from '../controllers/artPublicationController.mjs';
import { validateArtPublication } from '../middleware/artPublicationValidation.mjs';

/**
 * @swagger
 * /art-publication:
 *   post:
 *     summary: Create an Art Publication
 *     description: |
 *       Allows an authenticated user to publish their art.
 *       The publication can include various details like art type, name, description, dimension, and more.
 *       Additionally, users can specify if the art is for sale and its price.
 *     tags: [Art Publication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: URL of the art image.
 *                 example: "https://someimage.com/myart.png"
 *               artType:
 *                 type: string
 *                 description: Type of the art being published.
 *                 example: "Peinture"
 *               name:
 *                 type: string
 *                 description: Name or title of the art.
 *                 example: "Sunset by the Lake"
 *               description:
 *                 type: string
 *                 description: A short description of the art.
 *                 example: "A beautiful sunset captured in oil."
 *               dimension:
 *                 type: string
 *                 description: Dimensions of the art.
 *                 example: "50cm x 70cm"
 *               isForSale:
 *                 type: boolean
 *                 description: Is the art for sale?
 *                 example: true
 *               price:
 *                 type: number
 *                 description: Price if the art is for sale.
 *                 example: 350
 *               location:
 *                 type: string
 *                 description: Location where the art can be viewed or bought.
 *                 example: "40.7128, 74.0060"
 *     responses:
 *       200:
 *         description: Art publication created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating the success of the art publication.
 *       401:
 *         description: No token provided or token is invalid.
 *       422:
 *         description: Validation error (e.g. missing fields, invalid entries).
 *       500:
 *         description: Server Error.
 */
router.post('/', authenticate, validateArtPublication, createArtPublication);

export default router;
