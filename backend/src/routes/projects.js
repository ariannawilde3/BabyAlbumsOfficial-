import { Router } from 'express';
import Project from '../models/Project.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// All project routes use optional auth (guests can create projects)
router.use(optionalAuth);

// POST /api/projects — create a new project
router.post('/', async (req, res) => {
  try {
    const { title, bookSize, bookType, templateId, pages } = req.body;
    const project = await Project.create({
      user: req.userId || null,
      guestId: req.userId ? null : req.guestId,
      title,
      bookSize,
      bookType,
      templateId: templateId || null,
      pages: pages || [{ layout: 'single', images: [], captions: [] }],
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects — list user's projects
router.get('/', async (req, res) => {
  try {
    const filter = req.userId
      ? { user: req.userId }
      : req.guestId
        ? { guestId: req.guestId }
        : null;

    if (!filter) {
      return res.json([]);
    }

    const projects = await Project.find(filter).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Ownership check
    const isOwner =
      (req.userId && project.user?.toString() === req.userId) ||
      (req.guestId && project.guestId === req.guestId);

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id — update project (auto-save endpoint)
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner =
      (req.userId && project.user?.toString() === req.userId) ||
      (req.guestId && project.guestId === req.guestId);

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, bookSize, bookType, pages, coverImage, status } = req.body;
    if (title !== undefined) project.title = title;
    if (bookSize !== undefined) project.bookSize = bookSize;
    if (bookType !== undefined) project.bookType = bookType;
    if (pages !== undefined) project.pages = pages;
    if (coverImage !== undefined) project.coverImage = coverImage;
    if (status !== undefined) project.status = status;

    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id — delete project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isOwner =
      (req.userId && project.user?.toString() === req.userId) ||
      (req.guestId && project.guestId === req.guestId);

    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
