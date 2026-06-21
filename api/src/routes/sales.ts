import { Router } from 'express';
import { getSales, createSale, deleteSale } from '../controllers/sales.js';

const router = Router();

router.get('/', getSales);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;
