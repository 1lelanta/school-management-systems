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

// Simple request logger for CORS debugging
app.use((req, _res, next) => {
  const incoming = req.headers.origin as string | undefined;
  if (incoming) console.log('[CORS] incoming origin ->', incoming);
  next();
});

// Log allowed origins at startup for debugging
console.log('[CORS] allowed origins ->', allowedOrigins.join(','));

// Explicitly handle OPTIONS preflight for API routes to ensure we return
// the necessary Access-Control-Allow-* headers even if the cors middleware
// later fails for some reason. This returns 204 with appropriate headers.
app.options('/api/*', (req, res) => {
  const origin = req.headers.origin as string | undefined;
  if (!origin) return res.sendStatus(204);
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }
  // Deny with 403 and JSON to make the response clear to debugging tools
  return res.status(403).json({ error: 'CORS origin denied', origin, allowed: allowedOrigins });
});

// Explicitly handle preflight OPTIONS to provide clear diagnostics when denied.
// Allow wildcard '*' or explicit origins. Rely on the `cors` middleware to
// properly respond to OPTIONS preflight requests so the browser receives
// the necessary Access-Control-Allow-* headers.
app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow non-browser requests with no origin (e.g., curl, server-to-server)
    if (!incomingOrigin) return callback(null, true);
    // Allow wildcard
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
      console.warn('[CORS] origin not permitted by cors middleware:', incomingOrigin);
      // Do not pass an Error to the callback; pass (null, false) so the cors
      // middleware will respond without throwing and without CORS headers.
      return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 204
}));

// Generic error handler to avoid HTML error pages and make errors visible in JSON
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR HANDLER]', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: err && err.message ? err.message : 'Internal Server Error' });
});
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
