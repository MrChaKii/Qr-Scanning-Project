import express from 'express';
import {
  createBreak,
  updateBreak,
  deleteBreak,
  getBreaks,
  migrateBreaks,
} from '../controllers/breakSessionController.js';

const router = express.Router();

// Get all break sessions
router.get('/', getBreaks);

// Create a break session
router.post('/create', createBreak);

// Migrate legacy duration/ISO records to HH:MM time-range format
router.post('/migrate-to-time-range', migrateBreaks);

// Update a break session
router.put('/:id', updateBreak);

// Delete a break session
router.delete('/:id', deleteBreak);

export default router;
