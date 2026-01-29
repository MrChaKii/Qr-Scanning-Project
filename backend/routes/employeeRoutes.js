import express from 'express';
import {
  createEmployee,
  getAllEmployees,
  getEmployeeByEmployeeId,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Employee routes
router.post('/', authorize('admin'), createEmployee);

// Scoped lookup endpoint (requires employeeId query param)
router.get('/lookup', authorize('admin', 'supervisor', 'security', 'process'), getEmployeeByEmployeeId);

router.get('/', authorize('admin', 'supervisor', 'security'), getAllEmployees);
router.get('/:id', authorize('admin', 'supervisor', 'security'), getEmployeeById);
// router.get('/qr/:qrCode', authorize('admin', 'supervisor', 'security'), getEmployeeByQR);
router.put('/:id', authorize('admin'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);

export default router;
