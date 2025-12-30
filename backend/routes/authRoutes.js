import express from 'express';
import {
  login,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/authController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Admin only routes
router.post('/users', createUser);
// router.post('/users', auth, authorize('admin'), createUser);
router.get('/users', auth, authorize('admin'), getAllUsers);
router.put('/users/:id', auth, authorize('admin'), updateUser);
router.delete('/users/:id', auth, authorize('admin'), deleteUser);

export default router;
