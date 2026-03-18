import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as SchedulesController from '../controllers/schedules';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => SchedulesController.list(req, res));
router.post('/', authorize('admin'), (req: AuthRequest, res) => SchedulesController.create(req, res));

export default router;
