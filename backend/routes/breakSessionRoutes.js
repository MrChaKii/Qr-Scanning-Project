import express from 'express';
import { createBreak, updateBreak, deleteBreak, getBreaks } from '../controllers/breakSessionController.js';

const router = express.Router();

// Create or end break (toggle)
router.post('/create', createBreak);

// Update a break session
router.put('/:id', updateBreak);

// Delete a break session
router.delete('/:id', deleteBreak);

// Get all break sessions
router.get('/', getBreaks);

export default router;
