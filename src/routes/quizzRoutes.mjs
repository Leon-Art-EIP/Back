import { Router } from "express";
const router = Router();
import { submitQuizz } from "../controllers/quizzController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

/**
 * @swagger
 * /api/quizz/submit:
 *   post:
 *     summary: Submit quizz answers
 *     description: |
 *       Allows an authenticated user to submit their quizz answers.
 *       Depending on the user's choices, various questions are presented in succession.
 *       The user has the flexibility to skip any question. The quizz helps the system understand user preferences.
 *     tags: [Quizz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               objective:
 *                 type: string
 *                 enum: [sell, discover, both]
 *                 description: The user's main objective for using the app.
 *                 example: sell
 *               artInterestType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Types of art the user is interested in. Multiple values possible.
 *                 example: [paint, sculpture]
 *               artSellingType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Types of art the user is interested to sell. Multiple values possible.
 *                 example: [paint, sculpture]
 *               location:
 *                 type: string
 *                 description: User's location if they wish to provide.
 *                 example: "40.7128, 74.0060"
 *               customCommands:
 *                 type: string
 *                 enum: [yes, no, maybe]
 *                 description: For sellers, if they are open to custom art requests.
 *                 example: yes
 *               budget:
 *                 type: string
 *                 enum: ["0-100", "100-500", "500-1000", "1000-10000", "above 10000", "not buying"]
 *                 description: For art discoverers, their budget range or if they're not interested in buying.
 *                 example: "100-500"
 *               discoveryMethod:
 *                 type: string
 *                 enum: [social networks, randomly, word of mouth, other]
 *                 description: How the user discovered the app.
 *                 example: social networks
 *     responses:
 *       200:
 *         description: Quizz submitted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating the success of the quizz submission.
 *       401:
 *         description: No token provided or token is invalid.
 *       422:
 *         description: Validation error (e.g. missing fields, invalid entries).
 *       500:
 *         description: Server Error.
 */
router.post("/submit", authenticate, submitQuizz);

export default router;
