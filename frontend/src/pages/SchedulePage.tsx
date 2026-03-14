import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Schedule, Class } from '../types';
import { Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_COLORS: Record<string, string> = {
  Monday: '#4f46e5', Tuesday: '#10b981', Wednesday: '#f59e0b', Thursday: '#3b82f6', Friday: '#ef4444'
};

export default function SchedulePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    api.get<any>('/classes').then(data => setClasses(data.classes));
  }, []);

  useEffect(() => {
    const params = selectedClassId ? `?class_id=${selectedClassId}` : '';
    api.get<any>(`/schedules${params}`).then(data => setSchedules(data.schedules));
  }, [selectedClassId]);

  const groupedByDay = DAYS.map(day => ({
    day,
    items: schedules.filter(s => s.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  return (
    <div>
      <div className="search-bar">
        <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {groupedByDay.map(({ day, items }) => (
          <div key={day} className="card">
            <div className="card-header" style={{ background: DAY_COLORS[day], color: 'white', borderRadius: '8px 8px 0 0' }}>
              <span className="card-title" style={{ color: 'white', fontSize: 14 }}>{day}</span>
            </div>
            <div className="card-body" style={{ padding: 8 }}>
              {items.length === 0 ? (
                <div className="empty-state" style={{ padding: 16 }}><p>No classes</p></div>
              ) : items.map(s => (
                <div key={s.id} style={{
                  padding: 10, marginBottom: 6, background: '#f8fafc',
                  borderRadius: 6, borderLeft: `3px solid ${DAY_COLORS[day]}`
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.subject_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={11} /> {s.start_time} - {s.end_time}
                  </div>
                  {s.teacher_name && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.teacher_name}</div>}
                  {s.class_name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.class_name}</div>}
                  {s.room && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.room}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table view */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">Full Schedule Table</span></div>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Class</th><th>Room</th></tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id}>
                  <td><span className="badge badge-blue">{s.day_of_week}</span></td>
                  <td>{s.start_time} - {s.end_time}</td>
                  <td style={{ fontWeight: 500 }}>{s.subject_name}</td>
                  <td>{s.teacher_name}</td>
                  <td>{s.class_name}</td>
                  <td>{s.room || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
