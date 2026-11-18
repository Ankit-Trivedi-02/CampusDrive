import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import coordinatorRoutes from './coordinatorRoutes';
import hrRoutes from './hrRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/coordinator', coordinatorRoutes);
router.use('/hr', hrRoutes);
router.use('/student', studentRoutes);

export default router;
