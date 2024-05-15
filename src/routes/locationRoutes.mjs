import { Router } from "express";
const router = Router();
import { updateUserLocation } from "../controllers/location/locationController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";
import { validateLocation } from "../middleware/validation/locationValidation.mjs";

/**
 * @swagger
 * /api/location/update:
 *   post:
 *     summary: Update user location
 *     description: Allows an authenticated user to update their location.
 *     tags: [Location]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 description: The user's latitude.
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 description: The user's longitude.
 *                 example: -74.0060
 *     responses:
 *       200:
 *         description: Location updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating the success of the location update.
 *       400:
 *         description: Missing or invalid location data.
 *       422:
 *         description: Validation error (e.g. invalid latitude or longitude).
 *       500:
 *         description: Server Error.
 */
router.post("/update", authenticate, validateLocation, updateUserLocation);

export default router;
