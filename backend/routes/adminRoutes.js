// routes/adminRoutes.js
import express from 'express';
import {
  dailyAttendancePerEmployee,
  totalWorkTimePerEmployee,
  machineUsageSummary,
  manpowerVsPermanent,
  companyWiseProductivity
} from '../controllers/adminController.js';

import {
  getDailyManpowerWorkHoursByCompany,
  getDailyAverageManpowerWorkHoursByCompany,
  getMonthlyManpowerWorkHoursByCompany
} from '../controllers/manpowerAnalyticsController.js';

import { getDailyEmployeeIdleTime } from '../controllers/idleAnalyticsController.js';

const router = express.Router();

// Admin reporting APIs
router.get('/report/daily-attendance', dailyAttendancePerEmployee);
router.get('/report/total-work-time', totalWorkTimePerEmployee);
router.get('/report/machine-usage', machineUsageSummary);
router.get('/report/manpower-vs-permanent', manpowerVsPermanent);
router.get('/report/company-productivity', companyWiseProductivity);

// Analytics (Manpower work hours)
router.get('/analytics/manpower-hours/daily', getDailyManpowerWorkHoursByCompany);
router.get('/analytics/manpower-hours/daily-average', getDailyAverageManpowerWorkHoursByCompany);
router.get('/analytics/manpower-hours/monthly', getMonthlyManpowerWorkHoursByCompany);

// Analytics (Employee idle time)
router.get('/analytics/employee-idle/daily', getDailyEmployeeIdleTime);

export default router;
