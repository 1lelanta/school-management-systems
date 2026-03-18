import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as ClassModel from '../models/class';
import { connectDatabase } from '../database';

export async function list(req: AuthRequest, res: Response) {
  try {
    const classes = await ClassModel.listClasses();
    res.json({ classes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { name, grade_level, section, academic_year, room, capacity } = req.body;
    if (!name || !grade_level || !academic_year) { res.status(400).json({ error: 'Name, grade level, and academic year are required' }); return; }
    const db = await connectDatabase();
    const id = uuidv4();
    const cls = { id, name, grade_level, section: section || null, academic_year, room: room || null, capacity: capacity || 30, created_at: new Date() };
    await db.collection('classes').insertOne(cls);
    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'create', entity_type: 'class', entity_id: id, details: `Class created: ${name}`, created_at: new Date() });
    res.status(201).json({ class: cls });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function get(req: AuthRequest, res: Response) {
  try {
    const classId = req.params.id;
    const detail = await ClassModel.getClassDetail(classId);
    if (!detail) { res.status(404).json({ error: 'Class not found' }); return; }
    res.json(detail);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addStudents(req: AuthRequest, res: Response) {
  try {
    const classId = req.params.id;
    const { student_ids } = req.body;
    if (!Array.isArray(student_ids)) { res.status(400).json({ error: 'student_ids must be an array' }); return; }
    await ClassModel.addStudentsToClass(classId, student_ids);
    res.json({ message: 'Students added to class' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addTeachers(req: AuthRequest, res: Response) {
  try {
    const classId = req.params.id;
    const { teacher_ids } = req.body;
    if (!Array.isArray(teacher_ids)) { res.status(400).json({ error: 'teacher_ids must be an array' }); return; }
    await ClassModel.addTeachersToClass(classId, teacher_ids);
    res.json({ message: 'Teachers assigned to class' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import classRoutes from '../routes/classes';
export default classRoutes;
