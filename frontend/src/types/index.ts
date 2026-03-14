export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  firstName: string;
  lastName: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_id_number: string;
  grade_class: string;
  enrollment_date: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  status: 'Active' | 'Graduated' | 'Suspended';
  notes: string | null;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  subject_specialization: string;
  contact_phone: string;
  office_hours: string;
  first_name: string;
  last_name: string;
  email: string;
  assigned_classes?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  grade_level: string;
  section: string;
  academic_year: string;
  room: string;
  capacity: number;
  student_count?: number;
  teacher_names?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  teacher_id: string;
  teacher_name?: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  subject_name?: string;
  subject_code?: string;
  class_name?: string;
  teacher_name?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  notes: string | null;
  first_name?: string;
  last_name?: string;
  student_id_number?: string;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  type: string;
  title: string;
  score: number;
  max_score: number;
  weight: number;
  notes: string | null;
  date: string;
  subject_name?: string;
  subject_code?: string;
  student_name?: string;
  graded_by_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_role: string;
  author_name: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: 'exam' | 'class' | 'meeting' | 'holiday' | 'other';
  start_date: string;
  end_date: string | null;
  class_id: string | null;
  class_name?: string;
  created_by_name: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  user_name: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  todayAttendance: { total: number; present: number };
  recentAnnouncements: Announcement[];
  upcomingEvents: Event[];
  recentActivity: ActivityLog[];
}
