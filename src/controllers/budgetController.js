import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const monthRange = (month) => {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
};

export const getBudgets = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { start, end } = monthRange(month);

  const budgets = await Budget.find({ user: req.user._id }).sort({ category: 1 });
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const spent = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const spentMap = Object.fromEntries(spent.map((s) => [s._id, s.total]));

  res.json({
    month,
    items: budgets.map((b) => {
      const used = spentMap[b.category] || 0;
      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        spent: used,
        remaining: b.limit - used,
        percent: b.limit > 0 ? Math.round((used / b.limit) * 100) : 0,
      };
    }),
  });
});

export const upsertBudget = asyncHandler(async (req, res) => {
  const { category, limit } = req.body;
  if (!category || limit == null || Number(limit) < 0) {
    res.status(400);
    throw new Error('ক্যাটাগরি আর সঠিক লিমিট দিন');
  }
  const item = await Budget.findOneAndUpdate(
    { user: req.user._id, category: String(category).trim() },
    { limit: Number(limit) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(item);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const item = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error('বাজেট পাওয়া যায়নি');
  }
  res.json({ message: 'বাজেট মুছে ফেলা হয়েছে' });
});
