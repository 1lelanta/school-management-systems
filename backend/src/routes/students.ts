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
    const { search, grade_class, status, enrollment_year, page = '1', limit = '20' } = req.query as any;
    const db = await getDb();
    const match: any = {};
    if (grade_class) match.grade_class = grade_class;
    if (status) match.status = status;
    if (enrollment_year) match.enrollment_date = { $regex: `^${enrollment_year}` };

    const searchRegex = search ? new RegExp(search, 'i') : null;

    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    ];

    if (searchRegex) {
      pipeline.push({ $match: { $or: [ { 'user.first_name': { $regex: searchRegex } }, { 'user.last_name': { $regex: searchRegex } }, { student_id_number: { $regex: searchRegex } } ] } });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * lim;

    pipeline.push({ $sort: { 'user.last_name': 1, 'user.first_name': 1 } });

    const facetPipeline = [
      { $facet: {
        data: [ { $skip: skip }, { $limit: lim }, { $project: { user: 0 } } ],
        total: [ { $count: 'count' } ]
      } }
    ];

    const agg = pipeline.concat(facetPipeline);
    const result = await db.collection('students').aggregate(agg).toArray();
    const data = result[0]?.data || [];
    const total = (result[0]?.total && result[0].total[0] && result[0].total[0].count) || 0;

    res.json({ students: data, total, page: pageNum, totalPages: Math.ceil(total / lim) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const studentAgg = await db.collection('students').aggregate([
      { $match: { id: req.params.id } },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { email: '$user.email', first_name: '$user.first_name', last_name: '$user.last_name' } },
      { $project: { user: 0 } }
    ]).toArray();

    const student = studentAgg[0];
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const classes = await db.collection('class_students').aggregate([
      { $match: { student_id: req.params.id } },
      { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: '$class' } }
    ]).toArray();

    const recentGrades = await db.collection('grades').aggregate([
      { $match: { student_id: req.params.id } },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $addFields: { subject_name: '$subject.name' } },
      { $project: { subject: 0 } },
      { $sort: { date: -1 } },
      { $limit: 10 }
    ]).toArray();

    const attendanceSummaryAgg = await db.collection('attendance').aggregate([
      { $match: { student_id: req.params.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]).toArray();

    const attendanceSummary: any = {};
    for (const s of attendanceSummaryAgg) attendanceSummary[s.status] = s.count;

    res.json({ student, classes, recentGrades, attendanceSummary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authorize('admin', 'teacher'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade_class, status, parent_name, parent_phone, parent_email, notes } = req.body;
    const db = await getDb();
    const student = await db.collection('students').findOne({ id: req.params.id });
    if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

    const update: any = {};
    if (grade_class !== undefined) update.grade_class = grade_class;
    if (status !== undefined) update.status = status;
    if (parent_name !== undefined) update.parent_name = parent_name;
    if (parent_phone !== undefined) update.parent_phone = parent_phone;
    if (parent_email !== undefined) update.parent_email = parent_email;
    if (notes !== undefined) update.notes = notes;
    if (Object.keys(update).length) {
      update.updated_at = new Date();
      await db.collection('students').updateOne({ id: req.params.id }, { $set: update });
    }

    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'update', entity_type: 'student', entity_id: req.params.id, details: 'Student profile updated', created_at: new Date() });

    const updated = await db.collection('students').findOne({ id: req.params.id });
    res.json({ message: 'Student updated', student: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
