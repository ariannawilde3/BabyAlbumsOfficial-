import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/favorites
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites/:templateId — toggle favorite
router.post('/:templateId', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const idx = user.favorites.indexOf(req.params.templateId);

    if (idx > -1) {
      user.favorites.splice(idx, 1);
    } else {
      user.favorites.push(req.params.templateId);
    }

    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update favorites' });
  }
});

export default router;
