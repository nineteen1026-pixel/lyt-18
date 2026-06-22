import { Router } from 'express';
import { getSales, createSale, refundSale, deleteSale } from '../controllers/sales.js';

const router = Router();

router.get('/', getSales);
router.post('/', createSale);
router.post('/:id/refund', refundSale);
router.delete('/:id', deleteSale);

export default router;
