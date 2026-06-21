import { Router } from 'express';
import { getItems, getItemById, createItem, updateItem, deleteItem, addUsageRecord } from '../controllers/items.js';

const router = Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/usage', addUsageRecord);

export default router;
