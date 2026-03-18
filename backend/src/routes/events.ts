import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as EventsController from '../controllers/events';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => EventsController.list(req, res));
router.post('/', authorize('admin', 'teacher'), (req: AuthRequest, res) => EventsController.create(req, res));

export default router;
