import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase } from '../database';

export async function seedDatabase(): Promise<void> {
  const db = await connectDatabase();
  const userCount = await db.collection('users').countDocuments();
  if (userCount > 0) return;

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Admin
  const adminId = uuidv4();
  await db.collection('users').insertOne({
    id: adminId,
    email: 'admin@school.com',
    password: hash('admin123'),
    role: 'admin',
    first_name: 'Sarah',
    last_name: 'Johnson',
    created_at: new Date(),
  });

  // Teachers
  const teacherData = [
    { first: 'James', last: 'Smith', email: 'james.smith@school.com', subject: 'Mathematics', phone: '555-0101', office: 'Mon/Wed 3-4 PM' },
    { first: 'Maria', last: 'Garcia', email: 'maria.garcia@school.com', subject: 'Science', phone: '555-0102', office: 'Tue/Thu 2-3 PM' },
    { first: 'Robert', last: 'Williams', email: 'robert.williams@school.com', subject: 'English', phone: '555-0103', office: 'Mon/Fri 1-2 PM' },
    { first: 'Emily', last: 'Chen', email: 'emily.chen@school.com', subject: 'History', phone: '555-0104', office: 'Wed/Fri 3-4 PM' },
  ];

  const teachers: { id: string; userId: string }[] = [];
  for (const t of teacherData) {
    const userId = uuidv4();
    const teacherId = uuidv4();
    await db.collection('users').insertOne({ id: userId, email: t.email, password: hash('teacher123'), role: 'teacher', first_name: t.first, last_name: t.last, created_at: new Date() });
    await db.collection('teachers').insertOne({ id: teacherId, user_id: userId, subject_specialization: t.subject, contact_phone: t.phone, office_hours: t.office, created_at: new Date() });
    teachers.push({ id: teacherId, userId });
  }

  // Subjects
  const subjectData = [
    { name: 'Mathematics', code: 'MATH101', desc: 'Algebra, Geometry, Calculus fundamentals', teacherIdx: 0 },
    { name: 'Science', code: 'SCI101', desc: 'Biology, Chemistry, Physics', teacherIdx: 1 },
    { name: 'English', code: 'ENG101', desc: 'Literature, Grammar, Composition', teacherIdx: 2 },
    { name: 'History', code: 'HIST101', desc: 'World History, Civics', teacherIdx: 3 },
    { name: 'Physical Education', code: 'PE101', desc: 'Sports, Fitness, Health', teacherIdx: 0 },
  ];

  const subjects: string[] = [];
  for (const s of subjectData) {
    const id = uuidv4();
    await db.collection('subjects').insertOne({ id, name: s.name, code: s.code, description: s.desc, teacher_id: teachers[s.teacherIdx].id, created_at: new Date() });
    subjects.push(id);
  }

  // Classes
  const classData = [
    { name: 'Grade 9-A', grade: '9', section: 'A', year: '2025-2026', room: 'Room 101' },
    { name: 'Grade 9-B', grade: '9', section: 'B', year: '2025-2026', room: 'Room 102' },
    { name: 'Grade 10-A', grade: '10', section: 'A', year: '2025-2026', room: 'Room 201' },
    { name: 'Grade 10-B', grade: '10', section: 'B', year: '2025-2026', room: 'Room 202' },
    { name: 'Grade 11-A', grade: '11', section: 'A', year: '2025-2026', room: 'Room 301' },
  ];

  const classes: string[] = [];
  for (const c of classData) {
    const id = uuidv4();
    await db.collection('classes').insertOne({ id, name: c.name, grade_level: c.grade, section: c.section, academic_year: c.year, room: c.room, capacity: 30, created_at: new Date() });
    classes.push(id);
    // Assign teachers and subjects (upsert to avoid duplicates)
    for (let i = 0; i < teachers.length; i++) {
      await db.collection('class_teachers').updateOne({ class_id: id, teacher_id: teachers[i].id }, { $setOnInsert: { class_id: id, teacher_id: teachers[i].id } }, { upsert: true });
    }
    for (const subId of subjects) {
      await db.collection('class_subjects').updateOne({ class_id: id, subject_id: subId }, { $setOnInsert: { class_id: id, subject_id: subId } }, { upsert: true });
    }
  }

  // Students
  const studentNames = [
    'Liam Anderson', 'Olivia Brown', 'Noah Davis', 'Emma Wilson', 'Aiden Martinez',
    'Sophia Taylor', 'Jackson Thomas', 'Isabella Moore', 'Lucas White', 'Mia Harris',
    'Ethan Clark', 'Ava Lewis', 'Mason Robinson', 'Charlotte Walker', 'Logan Young',
    'Amelia King', 'Alexander Wright', 'Harper Scott', 'Sebastian Green', 'Evelyn Adams',
    'Benjamin Baker', 'Abigail Nelson', 'Henry Hill', 'Emily Rivera', 'Daniel Campbell',
    'Ella Mitchell', 'Matthew Roberts', 'Scarlett Turner', 'Jack Phillips', 'Victoria Parker',
  ];

  const statuses = ['Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Active', 'Graduated', 'Suspended'];
  const allStudents: string[] = [];

  for (let i = 0; i < studentNames.length; i++) {
    const [first, last] = studentNames[i].split(' ');
    const userId = uuidv4();
    const studentId = uuidv4();
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@student.school.com`;
    const classIdx = i % classes.length;
    const gradeClass = classData[classIdx].name;
    const enrollYear = 2023 + (i % 3);
    const enrollDate = `${enrollYear}-0${1 + (i % 9)}-${10 + (i % 20)}`;
    const status = statuses[i % statuses.length];

    await db.collection('users').insertOne({ id: userId, email, password: hash('student123'), role: 'student', first_name: first, last_name: last, created_at: new Date() });
    await db.collection('students').insertOne({ id: studentId, user_id: userId, student_id_number: `STU-${(1000 + i).toString()}`, grade_class: gradeClass, enrollment_date: enrollDate, parent_name: `Parent of ${first}`, parent_phone: `555-${(2000 + i).toString()}`, parent_email: `parent.${last.toLowerCase()}@email.com`, status, notes: i % 3 === 0 ? 'Honor roll student' : null, created_at: new Date() });
    await db.collection('class_students').updateOne({ class_id: classes[classIdx], student_id: studentId }, { $setOnInsert: { class_id: classes[classIdx], student_id: studentId } }, { upsert: true });
    allStudents.push(studentId);
  }

  // Schedules
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = [['08:00', '09:00'], ['09:15', '10:15'], ['10:30', '11:30'], ['12:00', '13:00'], ['13:15', '14:15']];

  for (let ci = 0; ci < classes.length; ci++) {
    for (let di = 0; di < days.length; di++) {
      for (let ti = 0; ti < Math.min(4, subjects.length); ti++) {
        const si = (ti + di + ci) % subjects.length;
        const tchi = (ti + ci) % teachers.length;
        await db.collection('schedules').insertOne({ id: uuidv4(), class_id: classes[ci], subject_id: subjects[si], teacher_id: teachers[tchi].id, day_of_week: days[di], start_time: times[ti][0], end_time: times[ti][1], room: classData[ci].room, created_at: new Date() });
      }
    }
  }

  // Attendance (last 14 days)
  const today = new Date();
  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (let si = 0; si < allStudents.length; si++) {
      const classIdx = si % classes.length;
      const rand = Math.random();
      const status = rand < 0.85 ? 'Present' : rand < 0.95 ? 'Late' : 'Absent';
      await db.collection('attendance').updateOne({ student_id: allStudents[si], class_id: classes[classIdx], date: dateStr }, { $setOnInsert: { id: uuidv4(), student_id: allStudents[si], class_id: classes[classIdx], date: dateStr, status, marked_by: teachers[0].userId, created_at: new Date() } }, { upsert: true });
    }
  }

  // Grades
  const gradeTypes = ['Assignment', 'Quiz', 'Exam', 'Project', 'Midterm'];
  for (const studentId of allStudents) {
    for (let g = 0; g < 8; g++) {
      const subIdx = g % subjects.length;
      const classIdx = allStudents.indexOf(studentId) % classes.length;
      const score = 55 + Math.floor(Math.random() * 45);
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);

      await db.collection('grades').insertOne({ id: uuidv4(), student_id: studentId, subject_id: subjects[subIdx], class_id: classes[classIdx], type: gradeTypes[g % gradeTypes.length], title: `${gradeTypes[g % gradeTypes.length]} ${g + 1}`, score, max_score: 100, graded_by: teachers[subIdx % teachers.length].userId, notes: null, date: date.toISOString().split('T')[0], created_at: new Date() });
    }
  }

  // Announcements
  const announcements = [
    { title: 'Welcome to New Academic Year', content: 'Welcome students and teachers to the 2025-2026 academic year! We look forward to a productive and exciting year.', target: 'all' },
    { title: 'Parent-Teacher Conference', content: 'Parent-Teacher conferences will be held on March 20th. Please schedule your appointments through the office.', target: 'all' },
    { title: 'Science Fair Registration', content: 'Science fair registration is now open. Submit your project proposals by March 25th.', target: 'student' },
    { title: 'Staff Meeting', content: 'Mandatory staff meeting on Friday at 3 PM in the main conference room.', target: 'teacher' },
    { title: 'Spring Break Notice', content: 'Spring break will be from April 7-11. School resumes on April 14.', target: 'all' },
  ];

  for (const a of announcements) {
    await db.collection('announcements').insertOne({ id: uuidv4(), title: a.title, content: a.content, author_id: adminId, target_role: a.target, created_at: new Date() });
  }

  // Events
  const events = [
    { title: 'Midterm Exams', type: 'exam', start: '2026-03-15', end: '2026-03-19' },
    { title: 'Spring Break', type: 'holiday', start: '2026-04-07', end: '2026-04-11' },
    { title: 'Science Fair', type: 'other', start: '2026-04-25', end: null },
    { title: 'Final Exams', type: 'exam', start: '2026-06-01', end: '2026-06-05' },
    { title: 'Graduation Ceremony', type: 'other', start: '2026-06-15', end: null },
  ];

  for (const e of events) {
    await db.collection('events').insertOne({ id: uuidv4(), title: e.title, event_type: e.type, start_date: e.start, end_date: e.end, created_by: adminId, created_at: new Date() });
  }

  // Activity log
  await db.collection('activity_log').insertOne({ id: uuidv4(), user_id: adminId, action: 'system_init', entity_type: 'system', details: 'School Management System initialized with seed data', created_at: new Date() });

  console.log('Database seeded successfully');
}

// If run directly, execute the seeder
if (require.main === module) {
  (async () => {
    try {
      await seedDatabase();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}
