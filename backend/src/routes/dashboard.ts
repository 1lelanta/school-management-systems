import { Router, Response } from 'express';
import { MongoClient } from 'mongodb';
import { AuthRequest, authenticate } from '../middleware/auth';

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

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();

    const totalStudents = await db.collection('students').countDocuments({ status: 'Active' });
    const totalTeachers = await db.collection('teachers').countDocuments();
    const totalClasses = await db.collection('classes').countDocuments();

    const today = new Date().toISOString().split('T')[0];
    const attendanceAgg = await db.collection('attendance').aggregate([
      { $match: { date: today } },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } } } },
    ]).toArray();
    const todayAttendance = attendanceAgg[0] || { total: 0, present: 0 };

    const attendanceRate = todayAttendance.total > 0
      ? Math.round((todayAttendance.present / todayAttendance.total) * 100)
      : 0;

    const recentAnnouncements = await db.collection('announcements').aggregate([
      { $sort: { created_at: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: 'author_id', foreignField: 'id', as: 'author' } },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $addFields: { author_name: { $concat: ['$author.first_name', ' ', '$author.last_name'] } } },
      { $project: { author: 0 } },
    ]).toArray();

    const upcomingEvents = await db.collection('events').aggregate([
      { $match: { start_date: { $gte: today } } },
      { $sort: { start_date: 1 } },
      { $limit: 5 },
      { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $addFields: { class_name: '$class.name' } },
      { $project: { class: 0 } },
    ]).toArray();

    const recentActivity = await db.collection('activity_log').aggregate([
      { $sort: { created_at: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { user_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
      { $project: { user: 0 } },
    ]).toArray();

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
      todayAttendance,
      recentAnnouncements,
      upcomingEvents,
      recentActivity,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/teachers', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const teachers = await db.collection('teachers').aggregate([
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'class_teachers', localField: 'id', foreignField: 'teacher_id', as: 'ct' } },
      { $unwind: { path: '$ct', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'classes', localField: 'ct.class_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$id', doc: { $first: '$$ROOT' }, classes: { $push: '$class.name' } } },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$$doc', { assigned_classes: '$classes' }] } } },
      { $addFields: { first_name: '$user.first_name', last_name: '$user.last_name', email: '$user.email' } },
      { $project: { ct: 0, class: 0, user: 0, doc: 0 } },
      { $sort: { last_name: 1 } },
    ]).toArray();
    res.json({ teachers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
