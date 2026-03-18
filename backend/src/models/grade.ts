import { connectDatabase } from '../database';

export async function createGrade(payload: any) {
  const db = await connectDatabase();
  await db.collection('grades').insertOne(payload);
}

export async function getGradesForStudent(studentId: string) {
  const db = await connectDatabase();
  const grades = await db.collection('grades').aggregate([
    { $match: { student_id: studentId } },
    { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'graded_by', foreignField: 'id', as: 'grader' } },
    { $unwind: { path: '$grader', preserveNullAndEmptyArrays: true } },
    { $addFields: { subject_name: '$subject.name', subject_code: '$subject.code', graded_by_name: { $concat: ['$grader.first_name', ' ', '$grader.last_name'] } } },
    { $project: { subject: 0, grader: 0 } },
    { $sort: { date: -1 } },
  ]).toArray();

  const subjectAverages = await db.collection('grades').aggregate([
    { $match: { student_id: studentId } },
    { $group: { _id: '$subject_id', average_percentage: { $avg: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } }, grade_count: { $sum: 1 } } },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: 'id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    { $project: { subject_name: '$subject.name', subject_id: '$_id', average_percentage: 1, grade_count: 1, _id: 0 } },
  ]).toArray();

  return { grades, subjectAverages };
}

export async function getGradesForClass(classId: string, subjectId?: string) {
  const db = await connectDatabase();
  const match: any = { class_id: classId };
  if (subjectId) match.subject_id = subjectId;

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
    { $match: { class_id: classId } },
    { $project: { pct: { $multiply: [{ $divide: ['$score', '$max_score'] }, 100] } } },
    { $addFields: { letter_grade: { $switch: { branches: [ { case: { $gte: ['$pct', 90] }, then: 'A' }, { case: { $gte: ['$pct', 80] }, then: 'B' }, { case: { $gte: ['$pct', 70] }, then: 'C' }, { case: { $gte: ['$pct', 60] }, then: 'D' } ], default: 'F' } } } },
    { $group: { _id: '$letter_grade', count: { $sum: 1 } } },
    { $project: { letter_grade: '$_id', count: 1, _id: 0 } },
    { $sort: { letter_grade: 1 } },
  ]).toArray();

  return { grades, distribution: distributionAgg };
}

export async function getGradeStats() {
  const db = await connectDatabase();
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

  return { classPerformance, overallDistribution };
}
