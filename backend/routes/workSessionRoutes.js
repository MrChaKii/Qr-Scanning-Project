import express from 'express';
import { getAllSessions, startSession, stopSession, updateWorkSessionTimes } from '../controllers/workSessionController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Start work session
router.post('/start', startSession);

// Stop work session
router.post('/stop', stopSession);

//Get all work sessions
router.get('/', getAllSessions)

// Admin-only: edit work session start/end times
router.put('/sessions/:id/times', auth, authorize('admin'), updateWorkSessionTimes);

export default router;
