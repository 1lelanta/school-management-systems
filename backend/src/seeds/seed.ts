

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

export function seedDatabase(): void {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 0) return;

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Admin
  const adminId = uuidv4();
  db.prepare('INSERT INTO users (id, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)').run(
    adminId, 'admin@school.com', hash('admin123'), 'admin', 'Sarah', 'Johnson'
  );

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
    db.prepare('INSERT INTO users (id, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, t.email, hash('teacher123'), 'teacher', t.first, t.last
    );
    db.prepare('INSERT INTO teachers (id, user_id, subject_specialization, contact_phone, office_hours) VALUES (?, ?, ?, ?, ?)').run(
      teacherId, userId, t.subject, t.phone, t.office
    );
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
    db.prepare('INSERT INTO subjects (id, name, code, description, teacher_id) VALUES (?, ?, ?, ?, ?)').run(
      id, s.name, s.code, s.desc, teachers[s.teacherIdx].id
    );
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
    db.prepare('INSERT INTO classes (id, name, grade_level, section, academic_year, room) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, c.name, c.grade, c.section, c.year, c.room
    );
    classes.push(id);
    // Assign teachers and subjects
    for (let i = 0; i < teachers.length; i++) {
      db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, teacher_id) VALUES (?, ?)').run(id, teachers[i].id);
    }
    for (const subId of subjects) {
      db.prepare('INSERT OR IGNORE INTO class_subjects (class_id, subject_id) VALUES (?, ?)').run(id, subId);
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

    db.prepare('INSERT INTO users (id, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId, email, hash('student123'), 'student', first, last
    );
    db.prepare(`INSERT INTO students (id, user_id, student_id_number, grade_class, enrollment_date, parent_name, parent_phone, parent_email, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      studentId, userId, `STU-${(1000 + i).toString()}`, gradeClass, enrollDate,
      `Parent of ${first}`, `555-${(2000 + i).toString()}`, `parent.${last.toLowerCase()}@email.com`,
      status, i % 3 === 0 ? 'Honor roll student' : null
    );
    db.prepare('INSERT OR IGNORE INTO class_students (class_id, student_id) VALUES (?, ?)').run(classes[classIdx], studentId);
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
        db.prepare(`INSERT INTO schedules (id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
          uuidv4(), classes[ci], subjects[si], teachers[tchi].id, days[di], times[ti][0], times[ti][1], classData[ci].room
        );
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
      db.prepare(`INSERT OR IGNORE INTO attendance (id, student_id, class_id, date, status, marked_by)
        VALUES (?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), allStudents[si], classes[classIdx], dateStr, status, teachers[0].userId
      );
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

      db.prepare(`INSERT INTO grades (id, student_id, subject_id, class_id, type, title, score, max_score, graded_by, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), studentId, subjects[subIdx], classes[classIdx],
        gradeTypes[g % gradeTypes.length], `${gradeTypes[g % gradeTypes.length]} ${g + 1}`,
        score, 100, teachers[subIdx % teachers.length].userId, date.toISOString().split('T')[0]
      );
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
    db.prepare('INSERT INTO announcements (id, title, content, author_id, target_role) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), a.title, a.content, adminId, a.target
    );
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
    db.prepare('INSERT INTO events (id, title, event_type, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), e.title, e.type, e.start, e.end, adminId
    );
  }

  // Activity log
  db.prepare('INSERT INTO activity_log (id, user_id, action, entity_type, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), adminId, 'system_init', 'system', 'School Management System initialized with seed data'
  );

  console.log('Database seeded successfully');
}
