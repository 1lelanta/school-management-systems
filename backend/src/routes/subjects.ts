import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as SubjectsController from '../controllers/subjects';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res) => SubjectsController.list(req, res));
router.post('/', authorize('admin'), (req: AuthRequest, res) => SubjectsController.create(req, res));

export default router;
