import { Router } from 'express';
import { getBudgets, upsertBudget, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);
router.get('/', getBudgets);
router.put('/', upsertBudget);
router.delete('/:id', deleteBudget);

export default router;
