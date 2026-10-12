import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const KEYWORDS = {
  যাতায়াত: ['pathao', 'uber', 'rickshaw', 'bus', 'cng', 'রিকশা', 'বাস', 'মেট্রো', 'train'],
  খাবার: ['foodpanda', 'kfc', 'restaurant', 'lunch', 'dinner', 'নাস্তা', 'খাবার', 'চা', 'coffee'],
  বিল: ['electricity', 'gas', 'internet', 'wifi', 'বিদ্যুৎ', 'বিল', 'wasa'],
  বাজার: ['bazar', 'বাজার', 'grocery', 'shwapno', 'meena'],
  শপিং: ['daraz', 'shopping', 'shirt', 'শপিং', 'amazon'],
  স্বাস্থ্য: ['pharmacy', 'doctor', 'hospital', 'medicine', 'ওষুধ'],
  শিক্ষা: ['course', 'book', 'tuition', 'স্কুল', 'কলেজ'],
  বিনোদন: ['netflix', 'spotify', 'movie', 'game', 'cinema'],
  বেতন: ['salary', 'বেতন', 'payroll'],
  ফ্রিল্যান্সিং: ['upwork', 'fiverr', 'freelance', 'client'],
};

export const getAiSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [totals, byCategory, recent] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: start } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: start } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({ user: userId }).sort({ date: -1 }).limit(8).lean(),
  ]);

  const income = totals.find((t) => t._id === 'income')?.total || 0;
  const expense = totals.find((t) => t._id === 'expense')?.total || 0;
  const top = byCategory[0];
  const tips = [];

  if (!recent.length) {
    return res.json({
      summary: 'এখনো কোনো লেনদেন নেই। প্রথম আয় বা খরচ যোগ করলে এখানে সঞ্চয়ের পরামর্শ দেখাবে।',
      tips: ['নতুন এন্ট্রি পেজ থেকে আজকের খরচ যোগ করে শুরু করুন।'],
      stats: { income, expense },
    });
  }

  if (expense > income && income > 0) {
    tips.push('এই মাসে খরচ আয় ছাড়িয়ে গেছে — অপ্রয়োজনীয় শপিং কমানোর চেষ্টা করুন।');
  } else if (income > expense) {
    const save = income - expense;
    tips.push(`এই মাসে প্রায় ৳${save.toLocaleString('en-IN')} সঞ্চয় হয়েছে — অভ্যাসটা ধরে রাখুন।`);
  }

  if (top) {
    tips.push(`সবচেয়ে বেশি খরচ «${top._id}» ক্যাটাগরিতে (৳${top.total.toLocaleString('en-IN')})।`);
  }

  if (byCategory.find((c) => c._id === 'খাবার' && c.total > expense * 0.35)) {
    tips.push('খাবারে খরচ মোট খরচের এক-তৃতীয়াংশের বেশি। বাড়িতে রান্না বাড়ালে সঞ্চয় বাড়বে।');
  }

  if (byCategory.find((c) => c._id === 'যাতায়াত' && c.total > expense * 0.25)) {
    tips.push('যাতায়াতে খরচ বেশি মনে হচ্ছে — সাপ্তাহিক পাস বা শেয়ারড রাইড বিবেচনা করুন।');
  }

  if (tips.length < 2) {
    tips.push('প্রতিটি খরচে ছোট নোট রাখলে মাস শেষে রিপোর্ট আরও স্পষ্ট হবে।');
  }

  const summary =
    income || expense
      ? `এই মাসে আয় ৳${income.toLocaleString('en-IN')} এবং খরচ ৳${expense.toLocaleString('en-IN')}। ব্যালেন্স ৳${(income - expense).toLocaleString('en-IN')}।`
      : 'এই মাসের ডাটা এখনো কম। আরও লেনদেন যোগ করলে পরামর্শ আরও নির্ভুল হবে।';

  res.json({ summary, tips, stats: { income, expense } });
});

export const categorize = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '');
  const lower = text.toLowerCase();
  const category =
    Object.keys(KEYWORDS).find((cat) => KEYWORDS[cat].some((k) => lower.includes(k))) || 'অন্যান্য';
  const amount = Number(text.match(/\d+(\.\d+)?/)?.[0]) || null;
  const type = ['বেতন', 'ফ্রিল্যান্সিং', 'ব্যবসা', 'উপহার'].includes(category) ? 'income' : 'expense';
  res.json({ category, amount, type });
});
