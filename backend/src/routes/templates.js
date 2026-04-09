import { Router } from 'express';
import Template from '../models/Template.js';

const router = Router();

// GET /api/templates — list all templates, optionally filter by category
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = req.query.category;
    }
    const templates = await Template.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id — get a single template
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

export default router;
