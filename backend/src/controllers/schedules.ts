import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as ScheduleModel from '../models/schedule';
import { connectDatabase } from '../database';

export async function list(req: AuthRequest, res: Response) {
  try {
    const { class_id, teacher_id } = req.query as any;
    const schedules = await ScheduleModel.listSchedules({ class_id, teacher_id });
    res.json({ schedules });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;
    if (!class_id || !subject_id || !teacher_id || !day_of_week || !start_time || !end_time) { res.status(400).json({ error: 'Missing required fields' }); return; }
    const id = uuidv4();
    const schedule = { id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room: room || null, created_at: new Date() };
    await ScheduleModel.createSchedule(schedule);
    res.status(201).json({ schedule });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import scheduleRoutes from '../routes/schedules';
export default scheduleRoutes;
