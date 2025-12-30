import express from 'express';
import { getAllSessions, startSession, stopSession } from '../controllers/workSessionController.js';

const router = express.Router();

// Start work session
router.post('/start', startSession);

// Stop work session
router.post('/stop', stopSession);

//Get all work sessions
router.get('/', getAllSessions)

export default router;
