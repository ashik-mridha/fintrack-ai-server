import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getMonthly,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect); // নিচের সব রাউটে লগইন লাগবে

router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.route('/').get(getTransactions).post(createTransaction);
router.route('/:id').put(updateTransaction).delete(deleteTransaction);

export default router;
