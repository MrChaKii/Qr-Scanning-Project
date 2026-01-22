import express from 'express';
import { 
  createProcess, 
  getAllProcesses, 
  getProcessById, 
  updateProcess, 
  deleteProcess,
  getProcessesByCompany 
} from '../controllers/processController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

// Create
router.post('/', authorize('admin'), createProcess);
// Read all
router.get('/', authorize('admin', 'supervisor'), getAllProcesses);
// Read by ID
router.get('/:processId', authorize('admin', 'supervisor'), getProcessById);
// Read by company
router.get('/company/:companyId', authorize('admin', 'supervisor'), getProcessesByCompany);
// Update
router.put('/:processId', authorize('admin'), updateProcess);
// Delete
router.delete('/:processId', authorize('admin'), deleteProcess);

export default router;
