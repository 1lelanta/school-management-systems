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
    const classes = await db.collection('classes').aggregate([
      {
        $lookup: {
          from: 'class_students',
          let: { classId: '$id' },
          pipeline: [{ $match: { $expr: { $eq: ['$class_id', '$$classId'] } } }, { $count: 'count' }],
          as: 'student_count_info',
        },
      },
      {
        $addFields: {
          student_count: { $ifNull: [{ $arrayElemAt: ['$student_count_info.count', 0] }, 0] },
        },
      },
      {
        $lookup: {
          from: 'class_teachers',
          let: { classId: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$class_id', '$$classId'] } } },
            { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
            { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
          ],
          as: 'teachers_info',
        },
      },
      {
        $addFields: {
          teacher_names: { $map: { input: '$teachers_info', as: 't', in: '$$t.name' } },
        },
      },
      { $project: { student_count_info: 0, teachers_info: 0 } },
      { $sort: { grade_level: 1, name: 1 } },
    ]).toArray();

    res.json({ classes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, grade_level, section, academic_year, room, capacity } = req.body;
    if (!name || !grade_level || !academic_year) {
      res.status(400).json({ error: 'Name, grade level, and academic year are required' });
      return;
    }
    const db = await getDb();
    const id = uuidv4();
    const cls = {
      id,
      name,
      grade_level,
      section: section || null,
      academic_year,
      room: room || null,
      capacity: capacity || 30,
      created_at: new Date(),
    };
    await db.collection('classes').insertOne(cls);

    await db.collection('activity_log').insertOne({
      id: uuidv4(),
      user_id: req.user!.id,
      action: 'create',
      entity_type: 'class',
      entity_id: id,
      details: `Class created: ${name}`,
      created_at: new Date(),
    });

    res.status(201).json({ class: cls });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const cls = await db.collection('classes').findOne({ id: req.params.id });
    if (!cls) { res.status(404).json({ error: 'Class not found' }); return; }

    const students = await db.collection('class_students').aggregate([
      { $match: { class_id: req.params.id } },
      { $lookup: { from: 'students', localField: 'student_id', foreignField: 'id', as: 'student' } },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'student.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$student', { first_name: '$user.first_name', last_name: '$user.last_name', email: '$user.email' }] } } },
    ]).toArray();

    const teachers = await db.collection('class_teachers').aggregate([
      { $match: { class_id: req.params.id } },
      { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: { $mergeObjects: ['$teacher', { first_name: '$user.first_name', last_name: '$user.last_name', email: '$user.email' }] } } },
    ]).toArray();

    const subjects = await db.collection('class_subjects').aggregate([
      { $match: { class_id: req.params.id } },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: '$subject' } },
    ]).toArray();

    const schedule = await db.collection('schedules').aggregate([
      { $match: { class_id: req.params.id } },
      { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $addFields: { subject_name: '$subject.name', teacher_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
      { $addFields: { dayOrder: { $switch: { branches: [ { case: { $eq: ['$day_of_week', 'Monday'] }, then: 1 }, { case: { $eq: ['$day_of_week', 'Tuesday'] }, then: 2 }, { case: { $eq: ['$day_of_week', 'Wednesday'] }, then: 3 }, { case: { $eq: ['$day_of_week', 'Thursday'] }, then: 4 }, { case: { $eq: ['$day_of_week', 'Friday'] }, then: 5 } ], default: 99 } } } },
      { $sort: { dayOrder: 1, start_time: 1 } },
      { $project: { subject: 0, teacher: 0, user: 0, dayOrder: 0 } },
    ]).toArray();

    res.json({ class: cls, students, teachers, subjects, schedule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/students', authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { student_ids } = req.body;
    if (!Array.isArray(student_ids)) {
      res.status(400).json({ error: 'student_ids must be an array' });
      return;
    }
    const db = await getDb();
    const ops = student_ids.map((sid: string) => ({
      updateOne: {
        filter: { class_id: req.params.id, student_id: sid },
        update: { $setOnInsert: { id: uuidv4(), class_id: req.params.id, student_id: sid } },
        upsert: true,
      },
    }));
    if (ops.length) await db.collection('class_students').bulkWrite(ops);
    res.json({ message: 'Students added to class' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/teachers', authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacher_ids } = req.body;
    if (!Array.isArray(teacher_ids)) {
      res.status(400).json({ error: 'teacher_ids must be an array' });
      return;
    }
    const db = await getDb();
    const ops = teacher_ids.map((tid: string) => ({
      updateOne: {
        filter: { class_id: req.params.id, teacher_id: tid },
        update: { $setOnInsert: { id: uuidv4(), class_id: req.params.id, teacher_id: tid } },
        upsert: true,
      },
    }));
    if (ops.length) await db.collection('class_teachers').bulkWrite(ops);
    res.json({ message: 'Teachers assigned to class' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
