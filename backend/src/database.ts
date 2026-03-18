import { MongoClient, Db } from 'mongodb';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME || 'school_management';

const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true } as any);
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) return db;
  await client.connect();
  db = client.db(dbName);
  await initializeDatabase(db);
  return db;
}

export async function initializeDatabase(database?: Db): Promise<void> {
  const d = database || db;
  if (!d) throw new Error('Database not connected');

  const collections = await d.listCollections().toArray();
  const names = collections.map((c) => c.name);

  const ensureCollection = async (name: string) => {
    if (!names.includes(name)) await d.createCollection(name);
  };

  // Create collections
  await ensureCollection('users');
  await ensureCollection('students');
  await ensureCollection('teachers');
  await ensureCollection('subjects');
  await ensureCollection('classes');
  await ensureCollection('class_teachers');
  await ensureCollection('class_students');
  await ensureCollection('class_subjects');
  await ensureCollection('schedules');
  await ensureCollection('attendance');
  await ensureCollection('grades');
  await ensureCollection('announcements');
  await ensureCollection('events');
  await ensureCollection('activity_log');

  // Indexes to enforce uniqueness / quick lookups
  await d.collection('users').createIndex({ email: 1 }, { unique: true });
  await d.collection('students').createIndex({ user_id: 1 }, { unique: true });
  await d.collection('students').createIndex({ student_id_number: 1 }, { unique: true });
  await d.collection('teachers').createIndex({ user_id: 1 }, { unique: true });
  await d.collection('subjects').createIndex({ code: 1 }, { unique: true });
  await d.collection('class_students').createIndex({ class_id: 1, student_id: 1 }, { unique: true });
  await d.collection('class_teachers').createIndex({ class_id: 1, teacher_id: 1 }, { unique: true });
  await d.collection('class_subjects').createIndex({ class_id: 1, subject_id: 1 }, { unique: true });
  await d.collection('attendance').createIndex({ student_id: 1, class_id: 1, date: 1 }, { unique: true });
  await d.collection('subjects').createIndex({ name: 1 });
  await d.collection('classes').createIndex({ name: 1 });

  // Additional helpful indexes
  await d.collection('schedules').createIndex({ class_id: 1 });
  await d.collection('grades').createIndex({ student_id: 1 });
  await d.collection('announcements').createIndex({ created_at: -1 });
  await d.collection('events').createIndex({ start_date: 1 });

  // Note: MongoDB does not enforce relational foreign keys; application should maintain referential integrity.
}

export { client };
export default db;
