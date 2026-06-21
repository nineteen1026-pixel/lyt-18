import { Router } from 'express';
import {
  getOffers,
  getOfferById,
  createOffer,
  counterOffer,
  acceptOffer,
  rejectOffer,
  createSaleFromOffer,
  deleteOffer,
} from '../controllers/offers.js';

const router = Router();

router.get('/', getOffers);
router.get('/:id', getOfferById);
router.post('/', createOffer);
router.post('/:id/counter', counterOffer);
router.post('/:id/accept', acceptOffer);
router.post('/:id/reject', rejectOffer);
router.post('/:id/create-sale', createSaleFromOffer);
router.delete('/:id', deleteOffer);

export default router;
