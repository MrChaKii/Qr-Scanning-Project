import express from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { createChangeover, deleteChangeover, getChangeovers } from '../controllers/changeoverController.js';

const router = express.Router();

// Admin-only: temporary changeovers
router.get('/', auth, authorize('admin'), getChangeovers);
router.post('/', auth, authorize('admin'), createChangeover);
router.delete('/:id', auth, authorize('admin'), deleteChangeover);

export default router;
