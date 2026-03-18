import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as AttendanceController from '../controllers/attendance';

const router = Router();
router.use(authenticate);

router.post('/', authorize('admin', 'teacher'), (req: AuthRequest, res) => AttendanceController.record(req, res));
router.get('/class/:classId', (req: AuthRequest, res) => AttendanceController.byClass(req, res));
router.get('/student/:studentId', (req: AuthRequest, res) => AttendanceController.byStudent(req, res));
router.get('/stats', (req: AuthRequest, res) => AttendanceController.stats(req, res));

export default router;
