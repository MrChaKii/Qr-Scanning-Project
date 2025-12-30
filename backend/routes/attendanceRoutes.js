import express from 'express';
import { scanAtSecurity } from '../controllers/attendanceController.js';
import { getAttendanceSummary } from '../controllers/attendanceController.js';

const router = express.Router();

// POST /api/attendance/scan
router.post('/scan', scanAtSecurity);

// GET /api/attendance/summary?qrId=...&date=YYYY-MM-DD
router.get('/summary', getAttendanceSummary);

export default router;
