import { Router } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import * as DashboardController from '../controllers/dashboard';

const router = Router();
router.use(authenticate);

router.get('/stats', (req: AuthRequest, res) => DashboardController.stats(req, res));
router.get('/teachers', (req: AuthRequest, res) => DashboardController.teachers(req, res));

export default router;
