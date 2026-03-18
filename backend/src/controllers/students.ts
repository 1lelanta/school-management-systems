import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as StudentModel from '../models/student';
import { connectDatabase } from '../database';

export async function list(req: AuthRequest, res: Response) {
  try {
    const { search, grade_class, status, enrollment_year } = req.query as any;
    const page = parseInt((req.query as any).page || '1', 10);
    const limit = parseInt((req.query as any).limit || '20', 10);
    const result = await StudentModel.listStudents({ search, grade_class, status, enrollment_year, page, limit });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function get(req: AuthRequest, res: Response) {
  try {
    const studentId = req.params.id;
    const profile = await StudentModel.getStudentProfile(studentId);
    if (!profile) { res.status(404).json({ error: 'Student not found' }); return; }
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const studentId = req.params.id;
    const { grade_class, status, parent_name, parent_phone, parent_email, notes } = req.body;
    const update: any = {};
    if (grade_class !== undefined) update.grade_class = grade_class;
    if (status !== undefined) update.status = status;
    if (parent_name !== undefined) update.parent_name = parent_name;
    if (parent_phone !== undefined) update.parent_phone = parent_phone;
    if (parent_email !== undefined) update.parent_email = parent_email;
    if (notes !== undefined) update.notes = notes;

    const updated = await StudentModel.updateStudent(studentId, update);

    const db = await connectDatabase();
    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'update', entity_type: 'student', entity_id: studentId, details: 'Student profile updated', created_at: new Date() });

    res.json({ message: 'Student updated', student: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import studentRoutes from '../routes/students';
export default studentRoutes;
