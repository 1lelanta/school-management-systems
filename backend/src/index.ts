import express from 'express';
import cors from 'cors';
import { connectDatabase } from './database';
import { seedDatabase } from './seeds/seed';

import authRoutes from './controllers/auth';
import studentRoutes from './controllers/students';
import classRoutes from './controllers/classes';
import attendanceRoutes from './controllers/attendance';
import gradeRoutes from './controllers/grades';
import subjectRoutes from './controllers/subjects';
import scheduleRoutes from './controllers/schedules';
import announcementRoutes from './controllers/announcements';
import eventRoutes from './controllers/events';
import dashboardRoutes from './controllers/dashboard';

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins from env
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5174';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim());

// Debug logs
console.log('[CORS] allowed origins ->', allowedOrigins);

// CORS setup (CLEAN)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS')); // ✅ FIXED
  },
  credentials: true
}));

//  Handle preflight automatically
app.options('*', cors());

// Body parser
app.use(express.json());

// ================= ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================= ERROR HANDLER (LAST) =================
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ================= START SERVER =================
async function start() {
  try {
    await connectDatabase();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) start();

export default app;