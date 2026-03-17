import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import { AuthRequest, authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

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

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const subjects = await db.collection('subjects').aggregate([
      { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { teacher_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
      { $project: { teacher: 0, user: 0 } },
      { $sort: { name: 1 } },
    ]).toArray();
    res.json({ subjects });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description, teacher_id } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Name and code are required' });
      return;
    }
    const db = await getDb();
    const id = uuidv4();
    const subject = { id, name, code, description: description || null, teacher_id: teacher_id || null };
    await db.collection('subjects').insertOne(subject);

    res.status(201).json({ subject });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
