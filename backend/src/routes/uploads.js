import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const BUCKET = 'album-photos';

let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return supabase;
}

// POST /api/uploads — upload one or more images
router.post('/', optionalAuth, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      const ext = file.originalname.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `uploads/${filename}`;

      const { error } = await getSupabase().storage
        .from(BUCKET)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        continue;
      }

      const { data: urlData } = getSupabase().storage
        .from(BUCKET)
        .getPublicUrl(path);

      results.push({
        url: urlData.publicUrl,
        filename: file.originalname,
        size: file.size,
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
