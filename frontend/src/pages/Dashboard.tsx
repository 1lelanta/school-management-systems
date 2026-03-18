import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { DashboardStats } from '../types';
import { Users, BookOpen, ClipboardCheck, GraduationCap, Megaphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gradeStats, setGradeStats] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats').then(setStats);
    api.get<any>('/grades/stats').then(setGradeStats);
    api.get<any>('/attendance/stats').then(setAttendanceStats);
  }, []);

  if (!stats) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={20} /></div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><GraduationCap size={20} /></div>
          <div className="stat-label">Total Teachers</div>
          <div className="stat-value">{stats.totalTeachers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><BookOpen size={20} /></div>
          <div className="stat-label">Active Classes</div>
          <div className="stat-value">{stats.totalClasses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><ClipboardCheck size={20} /></div>
          <div className="stat-label">Attendance Rate</div>
          <div className="stat-value">{stats.attendanceRate}%</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Attendance Trend */}
        <div className="card">
          <div className="card-header"><span className="card-title">Attendance Trend (30 Days)</span></div>
          <div className="card-body">
            {attendanceStats?.dailyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceStats.dailyTrend.map((d: any) => ({
                  date: d.date.slice(5),
                  rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={11} tickLine={false} />
                  <Tooltip formatter={(val: number) => `${val}%`} />
                  <Bar dataKey="rate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No attendance data yet</p></div>}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="card">
          <div className="card-header"><span className="card-title">Grade Distribution</span></div>
          <div className="card-body">
            {gradeStats?.overallDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={gradeStats.overallDistribution} dataKey="count" nameKey="letter_grade" cx="50%" cy="50%" outerRadius={90} label={({ letter_grade, count }) => `${letter_grade}: ${count}`}>
                    {gradeStats.overallDistribution.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No grade data yet</p></div>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Announcements */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Megaphone size={16} style={{ marginRight: 8 }} />Recent Announcements</span>
          </div>
          <div className="card-body">
            {stats.recentAnnouncements.length > 0 ? stats.recentAnnouncements.map(a => (
              <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{a.content.slice(0, 120)}...</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  By {a.author_name} &middot; {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>
            )) : <div className="empty-state"><p>No announcements yet</p></div>}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header"><span className="card-title">Upcoming Events</span></div>
          <div className="card-body">
            {stats.upcomingEvents.length > 0 ? stats.upcomingEvents.map(e => (
              <div key={e.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className={`badge badge-${e.event_type === 'exam' ? 'red' : e.event_type === 'holiday' ? 'green' : 'blue'}`}>
                  {e.event_type}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(e.start_date).toLocaleDateString()}
                    {e.end_date ? ` - ${new Date(e.end_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            )) : <div className="empty-state"><p>No upcoming events</p></div>}
          </div>
        </div>
      </div>

      {/* Class Performance */}
      {gradeStats?.classPerformance?.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><span className="card-title">Class Performance Overview</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gradeStats.classPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} fontSize={11} />
                <YAxis dataKey="class_name" type="category" width={100} fontSize={12} />
                <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                <Bar dataKey="average_percentage" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
