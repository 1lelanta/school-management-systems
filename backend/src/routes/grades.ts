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
    const { student_id, subject_id, class_id, type, title, score, max_score, weight, notes, date } = req.body;

    if (!student_id || !subject_id || !class_id || !type || !title || score === undefined || !date) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const db = await getDb();
    const id = uuidv4();
    const grade = {
      id,
      student_id,
      subject_id,
      class_id,
      type,
      title,
      score,
      max_score: max_score || 100,
      weight: weight || 1.0,
      graded_by: req.user!.id,
      notes: notes || null,
      date,
      created_at: new Date(),
    };

    await (await getDb()).collection('grades').insertOne(grade);

    await db.collection('activity_log').insertOne({
      id: uuidv4(),
      user_id: req.user!.id,
      action: 'grade_submission',
      entity_type: 'grade',
      entity_id: id,
      details: `Grade submitted: ${title} - ${score}/${max_score || 100}`,
      created_at: new Date(),
    });

    res.status(201).json({ grade });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const grades = await db.collection('grades').aggregate([
      { $match: { student_id: req.params.studentId } },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'graded_by', foreignField: 'id', as: 'grader' } },
      { $unwind: { path: '$grader', preserveNullAndEmptyArrays: true } },
      { $addFields: { subject_name: '$subject.name', subject_code: '$subject.code', graded_by_name: { $concat: ['$grader.first_name', ' ', '$grader.last_name'] } } },
      { $project: { subject: 0, grader: 0 } },
      { $sort: { date: -1 } },
    ]).toArray();

    const subjectAverages = await db.collection('grades').aggregate([
      { $match: { student_id: req.params.studentId } },
      { $group: { _id: '$subject_id', average_percentage: { $avg: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } }, grade_count: { $sum: 1 } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $project: { subject_name: '$subject.name', subject_id: '$_id', average_percentage: 1, grade_count: 1, _id: 0 } },
    ]).toArray();

    res.json({ grades, subjectAverages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/class/:classId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject_id } = req.query as any;
    const db = await getDb();
    const match: any = { class_id: req.params.classId };
    if (subject_id) match.subject_id = subject_id;

    const grades = await db.collection('grades').aggregate([
      { $match: match },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'students', localField: 'student_id', foreignField: 'id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'student.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { subject_name: '$subject.name', student_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] }, student_id_number: '$student.student_id_number' } },
      { $project: { subject: 0, student: 0, user: 0 } },
      { $sort: { date: -1 } },
    ]).toArray();

    const distributionAgg = await db.collection('grades').aggregate([
      { $match: { class_id: req.params.classId } },
      { $project: { pct: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } } },
      { $addFields: { letter_grade: { $switch: { branches: [ { case: { $gte: ['$pct', 90] }, then: 'A' }, { case: { $gte: ['$pct', 80] }, then: 'B' }, { case: { $gte: ['$pct', 70] }, then: 'C' }, { case: { $gte: ['$pct', 60] }, then: 'D' } ], default: 'F' } } } },
      { $group: { _id: '$letter_grade', count: { $sum: 1 } } },
      { $project: { letter_grade: '$_id', count: 1, _id: 0 } },
      { $sort: { letter_grade: 1 } },
    ]).toArray();

    res.json({ grades, distribution: distributionAgg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const classPerformance = await db.collection('grades').aggregate([
      { $group: { _id: '$class_id', average_percentage: { $avg: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } }, students: { $addToSet: '$student_id' } } },
      { $addFields: { student_count: { $size: '$students' } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: 'id', as: 'class' } },
      { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
      { $project: { class_name: '$class.name', class_id: '$_id', average_percentage: 1, student_count: 1, _id: 0 } },
      { $sort: { average_percentage: -1 } },
    ]).toArray();

    const overallDistribution = await db.collection('grades').aggregate([
      { $project: { pct: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } } },
      { $addFields: { letter_grade: { $switch: { branches: [ { case: { $gte: ['$pct', 90] }, then: 'A' }, { case: { $gte: ['$pct', 80] }, then: 'B' }, { case: { $gte: ['$pct', 70] }, then: 'C' }, { case: { $gte: ['$pct', 60] }, then: 'D' } ], default: 'F' } } } },
      { $group: { _id: '$letter_grade', count: { $sum: 1 } } },
      { $project: { letter_grade: '$_id', count: 1, _id: 0 } },
      { $sort: { letter_grade: 1 } },
    ]).toArray();

    res.json({ classPerformance, overallDistribution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
