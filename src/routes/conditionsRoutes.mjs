import express from "express";
import { getConditions } from "../controllers/user/conditionsController.mjs";
const router = express.Router();


/**
 * @swagger
 * /api/conditions:
 *   get:
 *     summary: Retrieve a file containing conditions
 *     description: Fetches conditions from a text file and returns them.
 *     responses:
 *       200:
 *         description: A list of conditions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conditions:
 *                   type: string
 *                   description: The content of the conditions file.
 *       500:
 *         description: Server error.
 */
router.get("/conditions", getConditions);

export default router;