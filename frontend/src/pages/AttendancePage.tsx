import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Class, AttendanceRecord } from '../types';
import { Save, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [tab, setTab] = useState<'mark' | 'history'>('mark');
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<any>('/classes').then(data => setClasses(data.classes));
    api.get<any>('/attendance/stats').then(setStats);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    api.get<any>(`/classes/${selectedClassId}`).then(data => {
      setClassStudents(data.students);
      const defaultAttendance: Record<string, string> = {};
      data.students.forEach((s: any) => { defaultAttendance[s.id] = 'Present'; });
      setAttendance(defaultAttendance);
    });
    api.get<any>(`/attendance/class/${selectedClassId}?date=${date}`).then(data => {
      setExistingRecords(data.attendance);
      const existing: Record<string, string> = {};
      data.attendance.forEach((r: AttendanceRecord) => { existing[r.student_id] = r.status; });
      if (Object.keys(existing).length > 0) {
        setAttendance(prev => ({ ...prev, ...existing }));
      }
    });
  }, [selectedClassId, date]);

  const saveAttendance = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id, class_id: selectedClassId, date, status
    }));
    await api.post('/attendance', { records });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="search-bar">
        <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
          <option value="">Select a class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'mark' ? 'active' : ''}`} onClick={() => setTab('mark')}>Mark Attendance</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Statistics</button>
      </div>

      {tab === 'mark' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attendance for {date}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {saved && <span style={{ color: 'var(--success)', fontSize: 13 }}>Saved!</span>}
              <button className="btn btn-primary" onClick={saveAttendance} disabled={!selectedClassId || saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
          <div className="card-body">
            {!selectedClassId ? (
              <div className="empty-state"><p>Select a class to mark attendance</p></div>
            ) : classStudents.length === 0 ? (
              <div className="empty-state"><p>No students in this class</p></div>
            ) : (
              <div className="attendance-grid">
                {classStudents.map(s => (
                  <div key={s.id} className="attendance-row">
                    <span className="student-name">{s.first_name} {s.last_name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.student_id_number}</span>
                    <div className="attendance-btn-group">
                      {(['Present', 'Late', 'Absent'] as const).map(status => (
                        <button
                          key={status}
                          className={`attendance-btn ${attendance[s.id] === status ? `selected-${status.toLowerCase()}` : ''}`}
                          onClick={() => setAttendance(prev => ({ ...prev, [s.id]: status }))}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && stats && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Records (30d)</div>
              <div className="stat-value">{stats.overallRate?.total || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Present</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.overallRate?.present || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Late</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.overallRate?.late || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Absent</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.overallRate?.absent || 0}</div>
            </div>
          </div>

          {stats.dailyTrend?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title"><BarChart3 size={16} style={{ marginRight: 8 }} />Daily Attendance Rate</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.dailyTrend.map((d: any) => ({
                    date: d.date.slice(5),
                    rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
                    total: d.total,
                    present: d.present
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis domain={[0, 100]} fontSize={11} />
                    <Tooltip formatter={(val: number, name: string) => name === 'rate' ? `${val}%` : val} />
                    <Bar dataKey="rate" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Attendance Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
