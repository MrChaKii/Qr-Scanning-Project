import express from 'express';
import { generateQR } from '../controllers/qrController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/qr/generate
router.post('/generate', auth, authorize('admin'), generateQR);

export default router;
