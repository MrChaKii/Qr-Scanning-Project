import express from 'express';
import { handleScan } from '../controllers/scanController.js';

const router = express.Router();

// Central scan endpoint
router.post('/', handleScan);

export default router;
