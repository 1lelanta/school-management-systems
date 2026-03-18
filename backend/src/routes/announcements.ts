import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as AnnouncementsController from '../controllers/announcements';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => AnnouncementsController.list(req, res));
router.post('/', authorize('admin', 'teacher'), (req: AuthRequest, res) => AnnouncementsController.create(req, res));

export default router;
