import { connectDatabase } from '../database';

export async function listSubjects() {
  const db = await connectDatabase();
  const subjects = await db.collection('subjects').aggregate([
    { $lookup: { from: 'teachers', localField: 'teacher_id', foreignField: 'id', as: 'teacher' } },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'teacher.user_id', foreignField: 'id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $addFields: { teacher_name: { $concat: ['$user.first_name', ' ', '$user.last_name'] } } },
    { $project: { teacher: 0, user: 0 } },
    { $sort: { name: 1 } },
  ]).toArray();
  return subjects;
}

export async function createSubject(payload: any) {
  const db = await connectDatabase();
  await db.collection('subjects').insertOne(payload);
}
