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

router.post('/', authorize('admin', 'teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      res.status(400).json({ error: 'records must be an array of { student_id, class_id, date, status, notes }' });
      return;
    }

    const db = await getDb();
    const ops = records.map((r: any) => {
      return {
        updateOne: {
          filter: { student_id: r.student_id, class_id: r.class_id, date: r.date },
          update: {
            $set: {
              status: r.status,
              marked_by: req.user!.id,
              notes: r.notes || null,
              updated_at: new Date(),
            },
            $setOnInsert: {
              id: uuidv4(),
              created_at: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    if (ops.length) await db.collection('attendance').bulkWrite(ops);

    await db.collection('activity_log').insertOne({
      id: uuidv4(),
      user_id: req.user!.id,
      action: 'mark_attendance',
      entity_type: 'attendance',
      entity_id: null,
      details: `Marked attendance for ${records.length} students`,
      created_at: new Date(),
    });

    res.json({ message: `Attendance recorded for ${records.length} students` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/class/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, start_date, end_date } = req.query as any;
    const db = await getDb();

    const match: any = { class_id: req.params.classId };
    if (date) match.date = date;
    else if (start_date && end_date) match.date = { $gte: start_date, $lte: end_date };

    const records = await db
      .collection('attendance')
      .aggregate([
        { $match: match },
        { $lookup: { from: 'students', localField: 'student_id', foreignField: 'id', as: 'student' } },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users', localField: 'student.user_id', foreignField: 'id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $addFields: { first_name: '$user.first_name', last_name: '$user.last_name', student_id_number: '$student.student_id_number' } },
        { $sort: { date: -1, last_name: 1 } },
        { $project: { student: 0, user: 0 } },
      ])
      .toArray();

    res.json({ attendance: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const records = await db
      .collection('attendance')
      .aggregate([
        { $match: { student_id: req.params.studentId } },
        { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
        { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
        { $addFields: { class_name: '$class.name' } },
        { $project: { class: 0 } },
        { $sort: { date: -1 } },
      ])
      .toArray();

    const summaryAgg = await db.collection('attendance').aggregate([
      { $match: { student_id: req.params.studentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();
    const summary: any = {};
    for (const s of summaryAgg) summary[s._id] = s.count;

    res.json({ attendance: records, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const overallAgg = await db.collection('attendance').aggregate([
      { $match: { date: { $gte: thirtyDaysAgoStr, $lte: todayStr } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        },
      },
    ]).toArray();
    const overallRate = overallAgg[0] || { total: 0, present: 0, absent: 0, late: 0 };

    const dailyTrend = await db.collection('attendance').aggregate([
      { $match: { date: { $gte: thirtyDaysAgoStr, $lte: todayStr } } },
      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', total: 1, present: 1, _id: 0 } },
    ]).toArray();

    res.json({ overallRate, dailyTrend });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
