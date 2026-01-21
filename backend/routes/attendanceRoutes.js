import express from 'express';
import { scanAtSecurity, getAttendanceSummary, getDailySummary } from '../controllers/attendanceController.js';

const router = express.Router();

// POST /api/attendance/scan
router.post('/scan', scanAtSecurity);

// GET /api/attendance/summary?qrId=...&date=YYYY-MM-DD
router.get('/summary', getAttendanceSummary);

// GET /api/attendance/daily-summary?date=YYYY-MM-DD
router.get('/daily-summary', getDailySummary);

export default router;
