import express from 'express';
import { getPublicDailyEmployeeIdleTime, getPublicDashboardSummary } from '../controllers/publicController.js';

const router = express.Router();

// Public dashboard summary
router.get('/dashboard-summary', getPublicDashboardSummary);

// Public analytics
router.get('/employee-idle/daily', getPublicDailyEmployeeIdleTime);

export default router;
