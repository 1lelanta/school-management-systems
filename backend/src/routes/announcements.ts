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
    const announcements = await db
      .collection('announcements')
      .aggregate([
        {
          $match: {
            $or: [
              { target_role: { $in: ['all', req.user!.role] } },
              { author_id: req.user!.id },
            ],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'author_id',
            foreignField: 'id',
            as: 'author',
          },
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        { $addFields: { author_name: { $concat: ['$author.first_name', ' ', '$author.last_name'] } } },
        { $sort: { created_at: -1 } },
        { $limit: 50 },
        { $project: { author: 0 } },
      ])
      .toArray();

    res.json({ announcements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin', 'teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, target_role } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }
    const db = await getDb();
    const id = uuidv4();
    const announcement = {
      id,
      title,
      content,
      author_id: req.user!.id,
      target_role: target_role || 'all',
      created_at: new Date(),
    };

    await db.collection('announcements').insertOne(announcement);

    await db.collection('activity_log').insertOne({
      id: uuidv4(),
      user_id: req.user!.id,
      action: 'announcement',
      entity_type: 'announcement',
      entity_id: id,
      details: `New announcement: ${title}`,
      created_at: new Date(),
    });

    res.status(201).json({ announcement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
