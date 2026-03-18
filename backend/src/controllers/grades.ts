import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as GradeModel from '../models/grade';
import { connectDatabase } from '../database';

export async function create(req: AuthRequest, res: Response) {
  try {
    const { student_id, subject_id, class_id, type, title, score, max_score, weight, notes, date } = req.body;
    if (!student_id || !subject_id || !class_id || !type || !title || score === undefined || !date) { res.status(400).json({ error: 'Missing required fields' }); return; }
    const id = uuidv4();
    const grade = { id, student_id, subject_id, class_id, type, title, score, max_score: max_score || 100, weight: weight || 1.0, graded_by: req.user!.id, notes: notes || null, date, created_at: new Date() };
    await GradeModel.createGrade(grade);
    const db = await connectDatabase();
    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'grade_submission', entity_type: 'grade', entity_id: id, details: `Grade submitted: ${title} - ${score}/${max_score || 100}`, created_at: new Date() });
    res.status(201).json({ grade });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function forStudent(req: AuthRequest, res: Response) {
  try {
    const studentId = req.params.studentId;
    const result = await GradeModel.getGradesForStudent(studentId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function forClass(req: AuthRequest, res: Response) {
  try {
    const classId = req.params.classId;
    const { subject_id } = req.query as any;
    const result = await GradeModel.getGradesForClass(classId, subject_id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function stats(req: AuthRequest, res: Response) {
  try {
    const stats = await GradeModel.getGradeStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import gradeRoutes from '../routes/grades';
export default gradeRoutes;
