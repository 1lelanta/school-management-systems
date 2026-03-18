const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGO_DB_NAME || 'school_management';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const userCount = await db.collection('users').countDocuments();
    if (userCount > 0) {
      console.log('DB already has users, skipping seed');
      return;
    }

    const hash = (pw) => bcrypt.hashSync(pw, 10);

    const adminId = uuidv4();
    await db.collection('users').insertOne({ id: adminId, email: 'admin@school.com', password: hash('admin123'), role: 'admin', first_name: 'Sarah', last_name: 'Johnson', created_at: new Date() });

    const teacherUserId = uuidv4();
    const teacherId = uuidv4();
    await db.collection('users').insertOne({ id: teacherUserId, email: 'james.smith@school.com', password: hash('teacher123'), role: 'teacher', first_name: 'James', last_name: 'Smith', created_at: new Date() });
    await db.collection('teachers').insertOne({ id: teacherId, user_id: teacherUserId, subject_specialization: 'Mathematics', contact_phone: '555-0101', office_hours: 'Mon/Wed 3-4 PM', created_at: new Date() });

    const subjectId = uuidv4();
    await db.collection('subjects').insertOne({ id: subjectId, name: 'Mathematics', code: 'MATH101', description: 'Basic math', teacher_id: teacherId, created_at: new Date() });

    const classId = uuidv4();
    await db.collection('classes').insertOne({ id: classId, name: 'Grade 9-A', grade_level: '9', section: 'A', academic_year: '2025-2026', room: 'Room 101', capacity: 30, created_at: new Date() });
    await db.collection('class_teachers').insertOne({ class_id: classId, teacher_id: teacherId });
    await db.collection('class_subjects').insertOne({ class_id: classId, subject_id: subjectId });

    const studentUserId = uuidv4();
    const studentId = uuidv4();
    await db.collection('users').insertOne({ id: studentUserId, email: 'liam.anderson@student.school.com', password: hash('student123'), role: 'student', first_name: 'Liam', last_name: 'Anderson', created_at: new Date() });
    await db.collection('students').insertOne({ id: studentId, user_id: studentUserId, student_id_number: 'STU-1001', grade_class: 'Grade 9-A', enrollment_date: new Date().toISOString().split('T')[0], parent_name: 'Parent of Liam', parent_phone: '555-2000', parent_email: 'parent.anderson@email.com', status: 'Active', created_at: new Date() });
    await db.collection('class_students').insertOne({ class_id: classId, student_id: studentId });

    await db.collection('announcements').insertOne({ id: uuidv4(), title: 'Welcome', content: 'Welcome to the school!', author_id: adminId, target_role: 'all', created_at: new Date() });
    await db.collection('events').insertOne({ id: uuidv4(), title: 'Orientation', event_type: 'other', start_date: new Date().toISOString().split('T')[0], end_date: null, created_by: adminId, created_at: new Date() });

    await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: adminId, action: 'seed', entity_type: 'system', details: 'Seeded minimal data', created_at: new Date() });

    console.log('Minimal DB seed completed');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await client.close();
  }
}

run();
