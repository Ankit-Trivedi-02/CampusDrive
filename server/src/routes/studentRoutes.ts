import { Router } from 'express';
import {
  getStudentDashboard,
  getMyApplications,
  getUpcomingCompanies,
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('STUDENT'));

router.get('/dashboard', getStudentDashboard);
router.get('/my-applications', getMyApplications);
router.get('/upcoming-companies', getUpcomingCompanies);

export default router;
