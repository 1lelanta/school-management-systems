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

// Support a comma-separated list of allowed origins via CORS_ORIGIN env var.
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5174';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow non-browser requests with no origin (e.g., curl, server-to-server)
    if (!incomingOrigin) return callback(null, true);
    if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
    return callback(new Error('CORS origin denied'), false);
  },
  credentials: true
}));
app.use(express.json());

// Initialize DB, seed and then start server
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

// Routes
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
