import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as GradesController from '../controllers/grades';

const router = Router();
router.use(authenticate);

router.post('/', authorize('admin', 'teacher'), (req: AuthRequest, res) => GradesController.create(req, res));
router.get('/student/:studentId', (req: AuthRequest, res) => GradesController.forStudent(req, res));
router.get('/class/:classId', (req: AuthRequest, res) => GradesController.forClass(req, res));
router.get('/stats', (req: AuthRequest, res) => GradesController.stats(req, res));

export default router;
