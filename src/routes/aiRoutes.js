import { Router } from 'express';
import { getAiSummary, categorize } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/summary', getAiSummary);
router.post('/categorize', categorize);

export default router;
