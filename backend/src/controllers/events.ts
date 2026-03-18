import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as EventModel from '../models/event';

export async function list(req: AuthRequest, res: Response) {
  try {
    const { start_date, end_date, event_type } = req.query as any;
    const events = await EventModel.listEvents({ start_date, end_date, event_type });
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { title, description, event_type, start_date, end_date, class_id } = req.body;
    if (!title || !event_type || !start_date) { res.status(400).json({ error: 'Title, event type, and start date are required' }); return; }
    const id = uuidv4();
    const event = { id, title, description: description || null, event_type, start_date, end_date: end_date || null, class_id: class_id || null, created_by: req.user!.id, created_at: new Date() };
    await EventModel.createEvent(event);
    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import eventRoutes from '../routes/events';
export default eventRoutes;
