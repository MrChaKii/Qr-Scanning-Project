import express from 'express';
import { getPublicDashboardSummary } from '../controllers/publicController.js';

const router = express.Router();

// Public dashboard summary
router.get('/dashboard-summary', getPublicDashboardSummary);

export default router;
