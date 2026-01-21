import express from 'express';
import { generateQR, getQRForEmployee } from '../controllers/qrController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/qr/generate
router.post('/generate', auth, authorize('admin'), generateQR);

// GET /api/qr/employee/:employeeId - Get QR code for employee (for scanning)
router.get('/employee/:employeeId', auth, getQRForEmployee);

export default router;
