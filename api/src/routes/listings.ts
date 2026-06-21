import { Router } from 'express';
import { getListings, createListing, updateListing, deleteListing } from '../controllers/listings.js';

const router = Router();

router.get('/', getListings);
router.post('/', createListing);
router.put('/:id', updateListing);
router.delete('/:id', deleteListing);

export default router;
