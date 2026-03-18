import { connectDatabase } from '../database';

export async function recordAttendance(records: any[], markedBy: string) {
  const db = await connectDatabase();
  const ops = records.map((r) => ({
    updateOne: {
      filter: { student_id: r.student_id, class_id: r.class_id, date: r.date },
      update: {
        $set: {
          status: r.status,
          marked_by: markedBy,
          notes: r.notes || null,
          updated_at: new Date(),
        },
        $setOnInsert: { id: r.student_id + '-' + r.class_id + '-' + r.date, created_at: new Date() },
      },
      upsert: true,
    },
  }));
  if (ops.length) await db.collection('attendance').bulkWrite(ops);
}

export async function getAttendanceByClass(classId: string, opts: any) {
  const db = await connectDatabase();
  const { date, start_date, end_date } = opts || {};
  const match: any = { class_id: classId };
  if (date) match.date = date;
  else if (start_date && end_date) match.date = { $gte: start_date, $lte: end_date };

  const records = await db.collection('attendance').aggregate([
    { $match: match },
    { $lookup: { from: 'students', localField: 'student_id', foreignField: 'id', as: 'student' } },
    { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'student.user_id', foreignField: 'id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $addFields: { first_name: '$user.first_name', last_name: '$user.last_name', student_id_number: '$student.student_id_number' } },
    { $sort: { date: -1, last_name: 1 } },
    { $project: { student: 0, user: 0 } },
  ]).toArray();
  return records;
}

export async function getAttendanceByStudent(studentId: string) {
  const db = await connectDatabase();
  const records = await db.collection('attendance').aggregate([
    { $match: { student_id: studentId } },
    { $lookup: { from: 'classes', localField: 'class_id', foreignField: 'id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
    { $addFields: { class_name: '$class.name' } },
    { $project: { class: 0 } },
    { $sort: { date: -1 } },
  ]).toArray();

  const summaryAgg = await db.collection('attendance').aggregate([
    { $match: { student_id: studentId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).toArray();
  const summary: any = {};
  for (const s of summaryAgg) summary[s._id] = s.count;

  return { records, summary };
}

export async function getAttendanceStats() {
  const db = await connectDatabase();
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

  return { overallRate, dailyTrend };
}
