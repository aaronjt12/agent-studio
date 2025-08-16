import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/profile - Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;