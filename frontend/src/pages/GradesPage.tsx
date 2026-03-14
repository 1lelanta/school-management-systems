import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Class, Subject } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

export default function GradesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classGrades, setClassGrades] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [gradeStats, setGradeStats] = useState<any>(null);
  const [tab, setTab] = useState<'grades' | 'stats'>('grades');
  const [form, setForm] = useState({
    student_id: '', subject_id: '', type: 'Assignment', title: '',
    score: '', max_score: '100', notes: '', date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    api.get<any>('/classes').then(data => setClasses(data.classes));
    api.get<any>('/subjects').then(data => setSubjects(data.subjects));
    api.get<any>('/grades/stats').then(setGradeStats);
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    api.get<any>(`/grades/class/${selectedClassId}`).then(setClassGrades);
    api.get<any>(`/classes/${selectedClassId}`).then(data => setClassStudents(data.students));
  }, [selectedClassId]);

  const addGrade = async () => {
    await api.post('/grades', {
      ...form,
      class_id: selectedClassId,
      score: parseFloat(form.score),
      max_score: parseFloat(form.max_score),
    });
    setShowAdd(false);
    setForm({ student_id: '', subject_id: '', type: 'Assignment', title: '', score: '', max_score: '100', notes: '', date: new Date().toISOString().split('T')[0] });
    api.get<any>(`/grades/class/${selectedClassId}`).then(setClassGrades);
    api.get<any>('/grades/stats').then(setGradeStats);
  };

  return (
    <div>
      <div className="search-bar">
        <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
          <option value="">Select a class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(user?.role === 'admin' || user?.role === 'teacher') && selectedClassId && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Grade
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'grades' ? 'active' : ''}`} onClick={() => setTab('grades')}>Grade Book</button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>Analytics</button>
      </div>

      {tab === 'grades' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Grades</span></div>
          <div className="table-container">
            {!selectedClassId ? (
              <div className="empty-state"><p>Select a class to view grades</p></div>
            ) : !classGrades?.grades?.length ? (
              <div className="empty-state"><p>No grades recorded yet</p></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Student</th><th>Subject</th><th>Type</th><th>Title</th><th>Score</th><th>Percentage</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {classGrades.grades.map((g: any) => {
                    const pct = Math.round((g.score / g.max_score) * 100);
                    const badge = pct >= 90 ? 'badge-green' : pct >= 70 ? 'badge-blue' : pct >= 60 ? 'badge-yellow' : 'badge-red';
                    return (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 500 }}>{g.student_name}</td>
                        <td>{g.subject_name}</td>
                        <td><span className="badge badge-gray">{g.type}</span></td>
                        <td>{g.title}</td>
                        <td>{g.score}/{g.max_score}</td>
                        <td><span className={`badge ${badge}`}>{pct}%</span></td>
                        <td>{new Date(g.date).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {classGrades?.distribution?.length > 0 && (
            <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, marginBottom: 12 }}>Grade Distribution for this Class</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={classGrades.distribution} dataKey="count" nameKey="letter_grade" cx="50%" cy="50%" outerRadius={75}
                    label={({ letter_grade, count }) => `${letter_grade}: ${count}`}>
                    {classGrades.distribution.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && gradeStats && (
        <div>
          {gradeStats.classPerformance?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header"><span className="card-title">Class Performance Comparison</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gradeStats.classPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="class_name" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={11} />
                    <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                    <Bar dataKey="average_percentage" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Average %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {gradeStats.overallDistribution?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Overall Grade Distribution</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={gradeStats.overallDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="letter_grade" fontSize={14} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                      {gradeStats.overallDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Grade Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Grade</span>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-select" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                  <option value="">Select student</option>
                  {classStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['Assignment', 'Quiz', 'Exam', 'Project', 'Midterm', 'Final'].map(t =>
                      <option key={t} value={t}>{t}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 5 Quiz" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Score</label>
                  <input className="form-input" type="number" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Score</label>
                  <input className="form-input" type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addGrade} disabled={!form.student_id || !form.subject_id || !form.title || !form.score}>Submit Grade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
