import { Router } from 'express';
import CartItem from '../models/CartItem.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

function ownerFilter(req) {
  return req.userId ? { user: req.userId } : req.guestId ? { guestId: req.guestId } : null;
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const filter = ownerFilter(req);
    if (!filter) return res.json([]);
    const items = await CartItem.find(filter)
      .populate('project', 'title pages bookType bookSize')
      .populate('template', 'name image price')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { projectId, templateId, itemType, price } = req.body;
    const item = await CartItem.create({
      user: req.userId || null,
      guestId: req.userId ? null : req.guestId,
      project: projectId || null,
      template: templateId || null,
      itemType,
      price,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await CartItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const filter = ownerFilter(req);
    const isOwner =
      (req.userId && item.user?.toString() === req.userId) ||
      (req.guestId && item.guestId === req.guestId);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    if (req.body.quantity !== undefined) item.quantity = req.body.quantity;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await CartItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const isOwner =
      (req.userId && item.user?.toString() === req.userId) ||
      (req.guestId && item.guestId === req.guestId);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

export default router;
