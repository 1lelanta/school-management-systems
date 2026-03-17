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
    const { class_id, teacher_id } = req.query as any;
    const db = await getDb();
    const match: any = {};
    if (class_id) match.class_id = class_id;
    if (teacher_id) match.teacher_id = teacher_id;

    const schedules = await db.collection('schedules').aggregate([
      { $match: match },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { subject_name: '$subject.name', subject_code: '$subject.code', class_name: '$class.name', teacher_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
      { $addFields: { dayOrder: { $switch: { branches: [ { case: { $eq: ['$day_of_week', 'Monday'] }, then: 1 }, { case: { $eq: ['$day_of_week', 'Tuesday'] }, then: 2 }, { case: { $eq: ['$day_of_week', 'Wednesday'] }, then: 3 }, { case: { $eq: ['$day_of_week', 'Thursday'] }, then: 4 }, { case: { $eq: ['$day_of_week', 'Friday'] }, then: 5 } ], default: 99 } } } },
      { $sort: { dayOrder: 1, start_time: 1 } },
      { $project: { subject: 0, class: 0, teacher: 0, user: 0, dayOrder: 0 } },
    ]).toArray();

    res.json({ schedules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;
    if (!class_id || !subject_id || !teacher_id || !day_of_week || !start_time || !end_time) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    const db = await getDb();
    const id = uuidv4();
    const schedule = { id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room: room || null, created_at: new Date() };
    await db.collection('schedules').insertOne(schedule);

    res.status(201).json({ schedule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
