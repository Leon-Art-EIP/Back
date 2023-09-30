// routes/artistRoutes.mjs

import express from 'express';
import { getLatestArtists } from '../controllers/user/artist/artistController.mjs';
import { authenticate } from '../middleware/authenticate.mjs'; // Assuming you have this middleware for user authentication.

const router = express.Router();

router.get('/latest', authenticate, getLatestArtists); 

export default router;
