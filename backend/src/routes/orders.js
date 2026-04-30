import { Router } from 'express';
import Order from '../models/Order.js';
import CartItem from '../models/CartItem.js';
import Project from '../models/Project.js';
import Template from '../models/Template.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

function ownerFilter(req) {
  return req.userId ? { user: req.userId } : req.guestId ? { guestId: req.guestId } : null;
}

function detectCardBrand(number) {
  const n = number.replace(/\s+/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(?:011|5)/.test(n)) return 'Discover';
  return 'Card';
}

// POST /api/orders — create order from cart + checkout details
router.post('/', async (req, res) => {
  try {
    const { shippingAddress, payment } = req.body;

    if (!shippingAddress || !payment) {
      return res.status(400).json({ error: 'Missing shipping address or payment' });
    }

    const required = ['fullName', 'email', 'addressLine1', 'city', 'state', 'postalCode'];
    for (const field of required) {
      if (!shippingAddress[field]) {
        return res.status(400).json({ error: `Missing shipping field: ${field}` });
      }
    }

    const cardNumber = (payment.cardNumber || '').replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return res.status(400).json({ error: 'Invalid card number' });
    }

    const filter = ownerFilter(req);
    if (!filter) return res.status(400).json({ error: 'No cart found' });

    const cartItems = await CartItem.find(filter)
      .populate('project')
      .populate('template');

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const items = cartItems.map((ci) => {
      const isProject = ci.itemType === 'project';
      return {
        project: isProject ? ci.project?._id : null,
        template: !isProject ? ci.template?._id : null,
        itemType: ci.itemType,
        name: isProject ? (ci.project?.title || 'Album') : (ci.template?.name || 'Template'),
        image: !isProject ? ci.template?.image : null,
        quantity: ci.quantity,
        price: ci.price,
        snapshot: isProject && ci.project ? {
          title: ci.project.title,
          bookSize: ci.project.bookSize,
          bookType: ci.project.bookType,
          pages: ci.project.pages,
        } : null,
      };
    });

    // TEST MODE: shipping + tax zeroed for checkout testing — restore for production
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = 0;
    const tax = 0;
    const total = +(subtotal + shipping + tax).toFixed(2);

    const order = await Order.create({
      user: req.userId || null,
      guestId: req.userId ? null : req.guestId,
      items,
      subtotal: +subtotal.toFixed(2),
      shipping,
      tax,
      total,
      shippingAddress,
      payment: {
        method: 'card',
        last4: cardNumber.slice(-4),
        brand: detectCardBrand(cardNumber),
        cardName: payment.cardName || '',
      },
      status: 'paid',
    });

    // Mark associated projects as ordered
    const projectIds = items.filter(i => i.project).map(i => i.project);
    if (projectIds.length) {
      await Project.updateMany({ _id: { $in: projectIds } }, { status: 'ordered' });
    }

    // Clear the cart
    await CartItem.deleteMany(filter);

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders — list current user's/guest's orders
router.get('/', async (req, res) => {
  try {
    const filter = ownerFilter(req);
    if (!filter) return res.json([]);
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — single order details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner =
      (req.userId && order.user?.toString() === req.userId) ||
      (req.guestId && order.guestId === req.guestId);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
