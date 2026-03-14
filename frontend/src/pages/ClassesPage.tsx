import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Class } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, BookOpen, X } from 'lucide-react';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', grade_level: '', section: '', academic_year: '2025-2026', room: '', capacity: '30' });

  useEffect(() => {
    api.get<any>('/classes').then(data => setClasses(data.classes));
  }, []);

  const createClass = () => {
    api.post('/classes', { ...form, capacity: parseInt(form.capacity) }).then(() => {
      setShowCreate(false);
      setForm({ name: '', grade_level: '', section: '', academic_year: '2025-2026', room: '', capacity: '30' });
      api.get<any>('/classes').then(data => setClasses(data.classes));
    });
  };

  const viewClass = (id: string) => {
    api.get<any>(`/classes/${id}`).then(setSelectedClass);
  };

  return (
    <div>
      {user?.role === 'admin' && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Class
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {classes.map(c => (
          <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewClass(c.id)}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.academic_year}</p>
                </div>
                <span className="badge badge-blue">Grade {c.grade_level}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={14} /> {c.student_count || 0} students
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookOpen size={14} /> {c.room || 'N/A'}
                </span>
              </div>
              {c.teacher_names && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Teachers: {c.teacher_names}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View Class Detail */}
      {selectedClass && (
        <div className="modal-overlay" onClick={() => setSelectedClass(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{selectedClass.class.name} - Details</span>
              <button className="modal-close" onClick={() => setSelectedClass(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
                <div><strong>Grade:</strong> {selectedClass.class.grade_level}</div>
                <div><strong>Section:</strong> {selectedClass.class.section || '-'}</div>
                <div><strong>Room:</strong> {selectedClass.class.room || '-'}</div>
                <div><strong>Capacity:</strong> {selectedClass.class.capacity}</div>
                <div><strong>Year:</strong> {selectedClass.class.academic_year}</div>
                <div><strong>Students:</strong> {selectedClass.students.length}</div>
              </div>

              {selectedClass.teachers.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Assigned Teachers</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedClass.teachers.map((t: any) => (
                      <span key={t.id} className="badge badge-blue">{t.first_name} {t.last_name} - {t.subject_specialization}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedClass.subjects.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Subjects</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedClass.subjects.map((s: any) => (
                      <span key={s.id} className="badge badge-gray">{s.name} ({s.code})</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedClass.schedule.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Schedule</h4>
                  <table>
                    <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th></tr></thead>
                    <tbody>
                      {selectedClass.schedule.map((s: any) => (
                        <tr key={s.id}>
                          <td>{s.day_of_week}</td>
                          <td>{s.start_time} - {s.end_time}</td>
                          <td>{s.subject_name}</td>
                          <td>{s.teacher_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedClass.students.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Students ({selectedClass.students.length})</h4>
                  <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
                    <tbody>
                      {selectedClass.students.map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id_number}</td>
                          <td>{s.first_name} {s.last_name}</td>
                          <td><span className={`badge ${s.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Class</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Grade 9-C" />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade Level</label>
                  <input className="form-input" value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="e.g. 9" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input className="form-input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. C" />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <input className="form-input" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createClass}>Create Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
