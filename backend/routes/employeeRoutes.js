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
router.get('/lookup', authorize('admin', 'security', 'process'), getEmployeeByEmployeeId);

router.get('/', authorize('admin', 'security', 'process'), getAllEmployees);
router.get('/:id', authorize('admin', 'security', 'process'), getEmployeeById);
// router.get('/qr/:qrCode', authorize('admin', 'security', 'process'), getEmployeeByQR);
router.put('/:id', authorize('admin'), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);

export default router;
