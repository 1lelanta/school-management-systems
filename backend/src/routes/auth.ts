import { Router } from 'express';
import { register, login, me } from '../controllers/auth';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res) => register(req, res));
router.post('/login', (req: AuthRequest, res) => login(req, res));
router.get('/me', authenticate, (req: AuthRequest, res) => me(req, res));

export default router;
