import { connectDatabase } from '../database';

export async function listSchedules(opts: any) {
  const { class_id, teacher_id } = opts || {};
  const db = await connectDatabase();
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
  return schedules;
}

export async function createSchedule(payload: any) {
  const db = await connectDatabase();
  await db.collection('schedules').insertOne(payload);
}
