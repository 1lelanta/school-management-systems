import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as DashboardModel from '../models/dashboard';

export async function stats(req: AuthRequest, res: Response) {
  try {
    const data = await DashboardModel.getStats();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function teachers(req: AuthRequest, res: Response) {
  try {
    const teachers = await DashboardModel.listTeachers();
    res.json({ teachers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
import dashboardRoutes from '../routes/dashboard';
export default dashboardRoutes;
