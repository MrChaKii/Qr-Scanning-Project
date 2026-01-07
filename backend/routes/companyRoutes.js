import express from 'express';
import { createCompany, getAllCompanies, updateCompany, deleteCompany } from '../Controllers/companyController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);


// Create
router.post('/', authorize('admin'), createCompany);
// Read
router.get('/', authorize('admin', 'supervisor'), getAllCompanies);
// Update
router.put('/:companyId', authorize('admin'), updateCompany);
// Delete
router.delete('/:companyId', authorize('admin'), deleteCompany);


export default router;
