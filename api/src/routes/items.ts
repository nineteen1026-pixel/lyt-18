import { Router } from 'express';
import { getItems, getItemById, createItem, updateItem, deleteItem, addUsageRecord, getItemCostsList, addItemCost, deleteItemCost } from '../controllers/items.js';

const router = Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.post('/:id/usage', addUsageRecord);
router.get('/:id/costs', getItemCostsList);
router.post('/:id/costs', addItemCost);
router.delete('/:id/costs/:costId', deleteItemCost);

export default router;
