import express from 'express';
import { 
  createProcess, 
  getAllProcesses, 
  getProcessById, 
  updateProcess, 
  deleteProcess,
  getProcessesByCompany,
  getProcessesByUser 
} from '../controllers/processController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Create
router.post('/', authorize('admin'), createProcess);
// Read all
router.get('/', authorize('admin', 'process'), getAllProcesses);
// Read by ID
router.get('/:processId', authorize('admin', 'process'), getProcessById);
// Read by company
router.get('/company/:companyId', authorize('admin'), getProcessesByCompany);
// Read by user
router.get('/user/:userId', authorize('admin', 'process'), getProcessesByUser);
// Update
router.put('/:processId', authorize('admin'), updateProcess);
// Delete
router.delete('/:processId', authorize('admin'), deleteProcess);

export default router;
