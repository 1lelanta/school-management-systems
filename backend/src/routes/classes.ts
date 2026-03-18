import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as ClassesController from '../controllers/classes';

const router = Router();

router.use(authenticate);

router.get('/', (req: AuthRequest, res) => ClassesController.list(req, res));
router.post('/', authorize('admin'), (req: AuthRequest, res) => ClassesController.create(req, res));
router.get('/:id', (req: AuthRequest, res) => ClassesController.get(req, res));
router.post('/:id/students', authorize('admin'), (req: AuthRequest, res) => ClassesController.addStudents(req, res));
router.post('/:id/teachers', authorize('admin'), (req: AuthRequest, res) => ClassesController.addTeachers(req, res));

export default router;
