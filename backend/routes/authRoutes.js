import express from 'express';
import {
  login,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  linkUserToProcess,
  getUsersByRole
} from '../controllers/authController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Admin only routes
router.post('/users', createUser);
// router.post('/users', auth, authorize('admin'), createUser);
router.get('/users', auth, authorize('admin'), getAllUsers);
router.get('/users/role/:role', auth, authorize('admin'), getUsersByRole);
router.put('/users/:id', auth, authorize('admin'), updateUser);
router.delete('/users/:id', auth, authorize('admin'), deleteUser);
router.post('/users/link-process', auth, authorize('admin'), linkUserToProcess);

export default router;
