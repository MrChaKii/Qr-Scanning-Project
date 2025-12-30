// routes/adminRoutes.js
import express from 'express';
import {
  dailyAttendancePerEmployee,
  totalWorkTimePerEmployee,
  machineUsageSummary,
  manpowerVsPermanent,
  companyWiseProductivity
} from '../controllers/adminController.js';

const router = express.Router();

// Admin reporting APIs
router.get('/report/daily-attendance', dailyAttendancePerEmployee);
router.get('/report/total-work-time', totalWorkTimePerEmployee);
router.get('/report/machine-usage', machineUsageSummary);
router.get('/report/manpower-vs-permanent', manpowerVsPermanent);
router.get('/report/company-productivity', companyWiseProductivity);

export default router;
