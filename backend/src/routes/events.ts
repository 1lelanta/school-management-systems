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
    const { start_date, end_date, event_type } = req.query as any;
    const db = await getDb();
    const match: any = {};
    if (start_date) match.start_date = { $gte: start_date };
    if (end_date) match.start_date = match.start_date ? { ...match.start_date, $lte: end_date } : { $lte: end_date };
    if (event_type) match.event_type = event_type;

    const events = await db.collection('events').aggregate([
      { $match: match },
      { $lookup: { from: 'users', localField: 'created_by', foreignField: 'id', as: 'creator' } },
      { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
      { $addFields: { created_by_name: { $concat: ['$creator.first_name', ' ', '$creator.last_name'] } } },
      { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $addFields: { class_name: '$class.name' } },
      { $project: { creator: 0, class: 0 } },
      { $sort: { start_date: 1 } },
    ]).toArray();

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin', 'teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, event_type, start_date, end_date, class_id } = req.body;
    if (!title || !event_type || !start_date) {
      res.status(400).json({ error: 'Title, event type, and start date are required' });
      return;
    }
    const db = await getDb();
    const id = uuidv4();
    const event = {
      id,
      title,
      description: description || null,
      event_type,
      start_date,
      end_date: end_date || null,
      class_id: class_id || null,
      created_by: req.user!.id,
      created_at: new Date(),
    };

    await db.collection('events').insertOne(event);

    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
