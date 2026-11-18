import { Router } from 'express';
import {
  getAdminStats,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCoordinators,
  createCoordinator,
  updateCoordinator,
  getHrAccounts,
  createHrAccount,
  updateHrAccount,
  getStudents,
  getStudentDetails,
  getApplications,
  getActivityLogs,
  exportApplicationsCSV,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorize('ADMIN'));

// Stats & logs
router.get('/stats', getAdminStats);
router.get('/activity-logs', getActivityLogs);
router.get('/export-applications', exportApplicationsCSV);

// Companies
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Coordinators
router.get('/coordinators', getCoordinators);
router.post('/coordinators', createCoordinator);
router.put('/coordinators/:id', updateCoordinator);

// HR Accounts
router.get('/hr-accounts', getHrAccounts);
router.post('/hr-accounts', createHrAccount);
router.put('/hr-accounts/:id', updateHrAccount);

// Students
router.get('/students', getStudents);
router.get('/students/:id', getStudentDetails);

// Applications
router.get('/applications', getApplications);

export default router;
