import { Router } from 'express';
import { getSummary, getMonthlyData, getPlatformData, getCategoryData } from '../controllers/stats.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyData);
router.get('/platform', getPlatformData);
router.get('/category', getCategoryData);

export default router;
