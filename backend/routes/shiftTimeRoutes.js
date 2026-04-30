import express from 'express';
import { getShiftTimes, upsertShiftTimes } from '../controllers/shiftTimeController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, authorize('admin'), getShiftTimes);
router.put('/', auth, authorize('admin'), upsertShiftTimes);

export default router;
