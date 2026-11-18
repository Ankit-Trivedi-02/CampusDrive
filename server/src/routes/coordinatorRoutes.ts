import { Router } from 'express';
import {
  getCoordinatorStats,
  getStudents,
  createStudent,
  updateStudent,
  createApplication,
  getApplications,
  getAvailableCompanies,
} from '../controllers/coordinatorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('COORDINATOR', 'ADMIN'));

router.get('/stats', getCoordinatorStats);
router.get('/companies', getAvailableCompanies);
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.get('/applications', getApplications);
router.post('/applications', createApplication);

export default router;
