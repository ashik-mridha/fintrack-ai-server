import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const ALLOWED_FIELDS = ['type', 'amount', 'category', 'date', 'note'];
const pick = (body) => Object.fromEntries(ALLOWED_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));

// GET /api/transactions?month=2026-10&category=খাবার&type=expense&search=রিকশা
export const getTransactions = asyncHandler(async (req, res) => {
  const { month, category, type, search } = req.query;
  const filter = { user: req.user._id };

  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    filter.date = { $gte: start, $lt: end };
  }
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.note = { $regex: safe, $options: 'i' };
  }

  const items = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
  res.json(items);
});

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const item = await Transaction.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json(item);
});

// PUT /api/transactions/:id
export const updateTransaction = asyncHandler(async (req, res) => {
  const item = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pick(req.body),
    { new: true, runValidators: true }
  );
  if (!item) {
    res.status(404);
    throw new Error('লেনদেনটি পাওয়া যায়নি');
  }
  res.json(item);
});

// DELETE /api/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const item = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) {
    res.status(404);
    throw new Error('লেনদেনটি পাওয়া যায়নি');
  }
  res.json({ message: 'মুছে ফেলা হয়েছে' });
});

// GET /api/transactions/summary  →  ড্যাশবোর্ডের জন্য মোট আয়, খরচ, ব্যালেন্স ও ক্যাটাগরিভিত্তিক খরচ
export const getSummary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const totals = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const byCategory = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense' } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $project: { _id: 0, category: '$_id', total: 1 } },
  ]);

  const income = totals.find((t) => t._id === 'income')?.total || 0;
  const expense = totals.find((t) => t._id === 'expense')?.total || 0;
  res.json({ income, expense, balance: income - expense, byCategory });
});

// GET /api/transactions/monthly?year=2026
export const getMonthly = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00`);
  const end = new Date(`${year + 1}-01-01T00:00:00`);
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const income = rows.find((r) => r._id.month === month && r._id.type === 'income')?.total || 0;
    const expense = rows.find((r) => r._id.month === month && r._id.type === 'expense')?.total || 0;
    return {
      month,
      label: new Date(year, i, 1).toLocaleDateString('bn-BD', { month: 'short' }),
      income,
      expense,
      balance: income - expense,
    };
  });

  res.json({ year, months });
});
