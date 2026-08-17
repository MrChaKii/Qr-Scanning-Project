import express from 'express';
import {
  setPlannedAttendance,
  getPlannedAttendanceByDate,
  getPlannedVsActualAttendance
} from '../controllers/plannedAttendanceController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.use(authorize('admin'));

router.post('/', setPlannedAttendance);
router.get('/', getPlannedAttendanceByDate);
router.get('/vs-actual', getPlannedVsActualAttendance);

export default router;
