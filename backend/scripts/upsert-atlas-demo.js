const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function readEnvExample() {
  const p = path.resolve(__dirname, '../.env.example');
  if (!fs.existsSync(p)) return {};
  const raw = fs.readFileSync(p, 'utf8');
  const lines = raw.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const m = line.match(/^([^#=\s]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

async function main() {
  const env = readEnvExample();
  const uri = process.env.MONGO_URI || env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || env.MONGO_DB_NAME || 'school_management';
  if (!uri) {
    console.error('MONGO_URI not found in env or .env.example');
    process.exit(2);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(dbName);

    const users = [
      { email: 'admin@gmail.com', password: 'admin123', role: 'admin', first_name: 'Bekele', last_name: 'Tesfaye' },
      { email: 'almaz.kebede@school.et', password: 'teacher123', role: 'teacher', first_name: 'Almaz', last_name: 'Kebede' },
      { email: 'amanuel.bekele@student.school.et', password: 'student123', role: 'student', first_name: 'Amanuel', last_name: 'Bekele' },
    ];

    for (const u of users) {
      const existing = await db.collection('users').findOne({ email: u.email });
      if (existing) {
        console.log('Exists, skipping:', u.email);
        // Optionally ensure name/role are up-to-date
        await db.collection('users').updateOne({ email: u.email }, { $set: { role: u.role, first_name: u.first_name, last_name: u.last_name } });
        continue;
      }

      const id = uuidv4();
      const hashed = bcrypt.hashSync(u.password, 10);
      await db.collection('users').insertOne({ id, email: u.email, password: hashed, role: u.role, first_name: u.first_name, last_name: u.last_name, created_at: new Date() });

      if (u.role === 'student') {
        await db.collection('students').insertOne({ id: uuidv4(), user_id: id, student_id_number: `STU-${Math.floor(1000 + Math.random() * 9000)}`, grade_class: 'Unassigned', enrollment_date: new Date().toISOString().split('T')[0], status: 'Active', created_at: new Date() });
      }
      if (u.role === 'teacher') {
        await db.collection('teachers').insertOne({ id: uuidv4(), user_id: id, subject_specialization: 'General', created_at: new Date() });
      }

      console.log('Inserted:', u.email);
    }

    console.log('Upsert demo users complete');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.stack ? err.stack : err);
    try { await client.close(); } catch (e) {}
    process.exit(1);
  }
}

main();
