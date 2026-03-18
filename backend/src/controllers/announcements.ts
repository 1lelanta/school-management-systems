import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import * as AnnouncementModel from '../models/announcement';
import { connectDatabase } from '../database';

export async function list(req: AuthRequest, res: Response) {
  try {
    const announcements = await AnnouncementModel.listAnnouncements(req.user);
    res.json({ announcements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { title, content, target_role } = req.body;
    if (!title || !content) { res.status(400).json({ error: 'Title and content are required' }); return; }
    const id = uuidv4();
    const announcement = { id, title, content, author_id: req.user!.id, target_role: target_role || 'all', created_at: new Date() };
    await AnnouncementModel.createAnnouncement(announcement);
    const db = await connectDatabase();
    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: req.user!.id, action: 'announcement', entity_type: 'announcement', entity_id: id, details: `New announcement: ${title}`, created_at: new Date() });
    res.status(201).json({ announcement });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import announcementRoutes from '../routes/announcements';
export default announcementRoutes;
