import express from 'express';
import { createCompany, getAllCompanies } from '../Controllers/companyController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.post('/', authorize('admin'), createCompany);
router.get('/', authorize('admin', 'supervisor'), getAllCompanies);


export default router;
