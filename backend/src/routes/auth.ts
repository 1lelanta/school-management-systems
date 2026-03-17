import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import { AuthRequest, authenticate, JWT_SECRET } from '../middleware/auth';

const router = Router();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'school';

let mongoClient: MongoClient | null = null;
async function getDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient.db(MONGO_DB);
}

router.post('/register', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName } = req.body;

    if (!email || !password || !role || !firstName || !lastName) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const db = await getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = uuidv4();

    await db.collection('users').insertOne({
      id: userId,
      email,
      password: hashedPassword,
      role,
      first_name: firstName,
      last_name: lastName,
      created_at: new Date(),
    });

    if (role === 'student') {
      const studentIdNumber = 'STU-' + Date.now().toString(36).toUpperCase();
      await db.collection('students').insertOne({
        id: uuidv4(),
        user_id: userId,
        student_id_number: studentIdNumber,
        grade_class: 'Unassigned',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'Active',
      });
    }

    if (role === 'teacher') {
      await db.collection('teachers').insertOne({ id: uuidv4(), user_id: userId, subject_specialization: 'General' });
    }

    const token = jwt.sign(
      { id: userId, email, role, firstName, lastName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await db.collection('activity_log').insertOne({
      id: uuidv4(),
      user_id: userId,
      action: 'register',
      entity_type: 'user',
      entity_id: userId,
      details: `New ${role} registered: ${firstName} ${lastName}`,
      created_at: new Date(),
    });

    res.status(201).json({ token, user: { id: userId, email, role, firstName, lastName } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = await getDb();
    const user = (await db.collection('users').findOne({ email })) as any;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const user = (await db.collection('users').findOne({ id: req.user!.id })) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await db.collection('students').findOne({ user_id: user.id });
    } else if (user.role === 'teacher') {
      profile = await db.collection('teachers').findOne({ user_id: user.id });
    }

    res.json({
      user: { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
      profile
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
