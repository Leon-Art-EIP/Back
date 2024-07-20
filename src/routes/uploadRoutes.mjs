import { Router } from "express";
import express from "express";

const router = Router();

/**
 * @swagger
 * /api/uploads/{imageName}:
 *   get:
 *     summary: Retrieve a user's uploaded image
 *     description: |
 *       Retrieve a user's uploaded image from the server. This can include profile pictures, banner images, and any other user-uploaded images.
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: imageName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the image file (e.g. "1698074137145.jpg").
 *     responses:
 *       200:
 *         description: Successfully retrieved the image.
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found.
 *       500:
 *         description: Server Error.
 */
router.use("/", express.static("uploads"));

export default router;
