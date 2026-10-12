import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('নাম, ইমেইল আর পাসওয়ার্ড দিন');
  }
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: createToken(user._id), user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.matchPassword(password || ''))) {
    res.status(401);
    throw new Error('ইমেইল বা পাসওয়ার্ড ভুল');
  }
  res.json({ token: createToken(user._id), user });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});
