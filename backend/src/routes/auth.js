import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Project from '../models/Project.js';
import CartItem from '../models/CartItem.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function migrateGuestData(userId, guestId) {
  if (!guestId) return;
  await Project.updateMany({ guestId, user: null }, { user: userId, guestId: null });
  await CartItem.updateMany({ guestId, user: null }, { user: userId, guestId: null });
}

function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    favorites: user.favorites || [],
  };
}

// POST /api/auth/google — verify Google credential and return JWT
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });
    if (!user) {
      // Check if email already exists (email/password user linking Google)
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture || '';
        user.authProvider = user.passwordHash ? 'both' : 'google';
        await user.save();
      } else {
        user = await User.create({
          googleId,
          email,
          name,
          avatar: picture || '',
          authProvider: 'google',
        });
      }
    }

    const token = issueToken(user._id);

    // Migrate guest data if guest ID provided
    const guestId = req.headers['x-guest-id'];
    await migrateGuestData(user._id, guestId);

    res.json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/register — email/password registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'email',
    });

    const token = issueToken(user._id);

    const guestId = req.headers['x-guest-id'];
    await migrateGuestData(user._id, guestId);

    res.status(201).json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login — email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = issueToken(user._id);

    const guestId = req.headers['x-guest-id'];
    await migrateGuestData(user._id, guestId);

    res.json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me — get current user from JWT
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-__v -passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userResponse(user));
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
