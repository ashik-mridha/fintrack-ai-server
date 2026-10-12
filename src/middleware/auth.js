import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

// Authorization: Bearer <token> হেডার চেক করে req.user সেট করে
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('লগইন করা নেই');
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id);
  } catch {
    req.user = null;
  }

  if (!req.user) {
    res.status(401);
    throw new Error('টোকেন সঠিক নয়, আবার লগইন করুন');
  }
  next();
});
