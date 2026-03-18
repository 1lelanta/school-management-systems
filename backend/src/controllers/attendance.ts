import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as AttendanceModel from '../models/attendance';
import { connectDatabase } from '../database';

export async function record(req: AuthRequest, res: Response) {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) { res.status(400).json({ error: 'records must be an array of { student_id, class_id, date, status, notes }' }); return; }
    await AttendanceModel.recordAttendance(records, req.user!.id);
    const db = await connectDatabase();
    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'mark_attendance', entity_type: 'attendance', entity_id: null, details: `Marked attendance for ${records.length} students`, created_at: new Date() });
    res.json({ message: `Attendance recorded for ${records.length} students` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function byClass(req: AuthRequest, res: Response) {
  try {
    const classId = req.params.classId;
    const { date, start_date, end_date } = req.query as any;
    const records = await AttendanceModel.getAttendanceByClass(classId, { date, start_date, end_date });
    res.json({ attendance: records });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function byStudent(req: AuthRequest, res: Response) {
  try {
    const studentId = req.params.studentId;
    const result = await AttendanceModel.getAttendanceByStudent(studentId);
    res.json({ attendance: result.records, summary: result.summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function stats(req: AuthRequest, res: Response) {
  try {
    const stats = await AttendanceModel.getAttendanceStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import attendanceRoutes from '../routes/attendance';
export default attendanceRoutes;
