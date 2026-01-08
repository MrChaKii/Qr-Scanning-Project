import express from 'express';
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../Controllers/employeeController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Employee routes
router.post('/', authorize('admin'), createEmployee);
router.get('/', authorize('admin', 'supervisor', 'security'), getAllEmployees);
router.get('/:id', authorize('admin', 'supervisor', 'security'), getEmployeeById);
// router.get('/qr/:qrCode', authorize('admin', 'supervisor', 'security'), getEmployeeByQR);
router.put('/:id', authorize('admin'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);

export default router;
