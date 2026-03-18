import { Router } from 'express';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';
import * as StudentsController from '../controllers/students';

const router = Router();

router.use(authenticate);

router.get('/', (req: AuthRequest, res) => StudentsController.list(req, res));
router.get('/:id', (req: AuthRequest, res) => StudentsController.get(req, res));
router.put('/:id', authorize('admin', 'teacher'), (req: AuthRequest, res) => StudentsController.update(req, res));

export default router;
