import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as SubjectModel from '../models/subject';

export async function list(req: AuthRequest, res: Response) {
  try {
    const subjects = await SubjectModel.listSubjects();
    res.json({ subjects });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { name, code, description, teacher_id } = req.body;
    if (!name || !code) { res.status(400).json({ error: 'Name and code are required' }); return; }
    const id = uuidv4();
    const subject = { id, name, code, description: description || null, teacher_id: teacher_id || null };
    await SubjectModel.createSubject(subject);
    res.status(201).json({ subject });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import subjectRoutes from '../routes/subjects';
export default subjectRoutes;
