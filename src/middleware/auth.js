import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

// Authorization: Bearer <token> হেডার চেক করে req.user সেট করে
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('লগইন করা নেই, টোকেন পাওয়া যায়নি');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // পাসওয়ার্ড বা সংবেদনশীল তথ্য বাদ দিয়ে ইউজার খোঁজা এবং ইউজার রিমুভ হয়েছে কিনা চেক করা
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('টোকেনের ইউজার পাওয়া যায়নি, আবার লগইন করুন');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('টোকেন সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে');
  }
});