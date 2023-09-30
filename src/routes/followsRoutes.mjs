import { Router } from "express";
const router = Router();
import { followUser } from "../controllers/user/followsController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";


/**
 * @swagger
 * /api/users/{targetUserId}/follow:
 *   post:
 *     summary: Follow or unfollow a user
 *     description: |
 *       Follow or unfollow a user based on the given target user ID. 
 *       If the user is already following the target user, this endpoint will unfollow the user, 
 *       and vice versa. The user must be authenticated to access this endpoint.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to be followed or unfollowed.
 *     responses:
 *       200:
 *         description: Successfully followed or unfollowed the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: Successfully followed user.
 *       400:
 *         description: Bad Request (e.g. invalid user ID, following oneself, etc.)
 *       404:
 *         description: User to follow not found.
 *       500:
 *         description: Server Error.
 */

router.post("/follow/:targetUserId",authenticate, followUser);

export default router;