import { Router } from 'express';
import {
  getMyCompanies,
  getHrStats,
  getApplicants,
  updateApplicationStatus,
  exportHrApplicantsCSV,
} from '../controllers/hrController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize('HR', 'ADMIN'));

router.get('/my-companies', getMyCompanies);
router.get('/stats', getHrStats);
router.get('/applicants', getApplicants);
router.patch('/applications/:id/status', updateApplicationStatus);
router.get('/export-applicants', exportHrApplicantsCSV);

export default router;
