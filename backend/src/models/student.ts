import { connectDatabase } from '../database';

interface ListOptions {
  search?: string;
  grade_class?: string;
  status?: string;
  enrollment_year?: string;
  page?: number;
  limit?: number;
}

export async function listStudents(opts: ListOptions) {
  const { search, grade_class, status, enrollment_year } = opts;
  const page = Math.max(1, opts.page || 1);
  const limit = Math.max(1, opts.limit || 20);
  const skip = (page - 1) * limit;

  const db = await connectDatabase();
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

  pipeline.push({ $sort: { 'user.last_name': 1, 'user.first_name': 1 } });

  const facetPipeline = [
    { $facet: {
      data: [ { $skip: skip }, { $limit: limit }, { $project: { user: 0 } } ],
      total: [ { $count: 'count' } ]
    } }
  ];

  const agg = pipeline.concat(facetPipeline);
  const result = await db.collection('students').aggregate(agg).toArray();
  const data = result[0]?.data || [];
  const total = (result[0]?.total && result[0].total[0] && result[0].total[0].count) || 0;

  return { students: data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getStudentProfile(studentId: string) {
  const db = await connectDatabase();

  const studentAgg = await db.collection('students').aggregate([
    { $match: { id: studentId } },
    { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $addFields: { email: '$user.email', first_name: '$user.first_name', last_name: '$user.last_name' } },
    { $project: { user: 0 } }
  ]).toArray();

  const student = studentAgg[0];
  if (!student) return null;

  const classes = await db.collection('class_students').aggregate([
    { $match: { student_id: studentId } },
    { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
    { $replaceRoot: { newRoot: '$class' } }
  ]).toArray();

  const recentGrades = await db.collection('grades').aggregate([
    { $match: { student_id: studentId } },
    { $lookup: { from: 'subjects', localField: 'subject_id', foreignField: 'id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    { $addFields: { subject_name: '$subject.name' } },
    { $project: { subject: 0 } },
    { $sort: { date: -1 } },
    { $limit: 10 }
  ]).toArray();

  const attendanceSummaryAgg = await db.collection('attendance').aggregate([
    { $match: { student_id: studentId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } }
  ]).toArray();

  const attendanceSummary: any = {};
  for (const s of attendanceSummaryAgg) attendanceSummary[s.status] = s.count;

  return { student, classes, recentGrades, attendanceSummary };
}

export async function updateStudent(studentId: string, updates: any) {
  const db = await connectDatabase();
  if (Object.keys(updates).length) {
    updates.updated_at = new Date();
    await db.collection('students').updateOne({ id: studentId }, { $set: updates });
  }
  return await db.collection('students').findOne({ id: studentId });
}
