import { connectDatabase } from '../database';

export async function listClasses() {
  const db = await connectDatabase();
  const classes = await db.collection('classes').aggregate([
    {
      $lookup: {
        from: 'class_students',
        let: { classId: '$id' },
        pipeline: [{ $match: { $expr: { $eq: ['$class_id', '$$classId'] } } }, { $count: 'count' }],
        as: 'student_count_info',
      },
    },
    { $addFields: { student_count: { $ifNull: [{ $arrayElemAt: ['$student_count_info.count', 0] }, 0] } } },
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
    { $addFields: { teacher_names: { $map: { input: '$teachers_info', as: 't', in: '$$t.name' } } } },
    { $project: { student_count_info: 0, teachers_info: 0 } },
    { $sort: { grade_level: 1, name: 1 } },
  ]).toArray();
  return classes;
}

export async function getClassDetail(classId: string) {
  const db = await connectDatabase();
  const cls = await db.collection('classes').findOne({ id: classId });
  if (!cls) return null;

  const students = await db.collection('class_students').aggregate([
    { $match: { class_id: classId } },
    { $lookup: { from: 'students', localField: 'student_id', foreignField: 'id', as: 'student' } },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'student.user_id', foreignField: 'id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$student', { first_name: '$user.first_name', last_name: '$user.last_name', email: '$user.email' }] } } },
  ]).toArray();

  const teachers = await db.collection('class_teachers').aggregate([
    { $match: { class_id: classId } },
    { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$teacher', { first_name: '$user.first_name', last_name: '$user.last_name', email: '$user.email' }] } } },
  ]).toArray();

  const subjects = await db.collection('class_subjects').aggregate([
    { $match: { class_id: classId } },
    { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    { $replaceRoot: { newRoot: '$subject' } },
  ]).toArray();

  const schedule = await db.collection('schedules').aggregate([
    { $match: { class_id: classId } },
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

  return { cls, students, teachers, subjects, schedule };
}

export async function addStudentsToClass(classId: string, studentIds: string[]) {
  const db = await connectDatabase();
  const ops = studentIds.map((sid) => ({
    updateOne: {
      filter: { class_id: classId, student_id: sid },
      update: { $setOnInsert: { id: sid + '-' + Date.now().toString(36), class_id: classId, student_id: sid } },
      upsert: true,
    },
  }));
  if (ops.length) await db.collection('class_students').bulkWrite(ops);
}

export async function addTeachersToClass(classId: string, teacherIds: string[]) {
  const db = await connectDatabase();
  const ops = teacherIds.map((tid) => ({
    updateOne: {
      filter: { class_id: classId, teacher_id: tid },
      update: { $setOnInsert: { id: tid + '-' + Date.now().toString(36), class_id: classId, teacher_id: tid } },
      upsert: true,
    },
  }));
  if (ops.length) await db.collection('class_teachers').bulkWrite(ops);
}
