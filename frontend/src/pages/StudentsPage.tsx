import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Student } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Eye, Edit2, X } from 'lucide-react';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchStudents = () => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (filterClass) params.set('grade_class', filterClass);
    if (filterStatus) params.set('status', filterStatus);
    if (filterYear) params.set('enrollment_year', filterYear);

    api.get<any>(`/students?${params}`).then(data => {
      setStudents(data.students);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    });
  };

  useEffect(() => { fetchStudents(); }, [page, search, filterClass, filterStatus, filterYear]);

  const viewStudent = (id: string) => {
    api.get<any>(`/students/${id}`).then(setSelectedStudent);
  };

  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      grade_class: student.grade_class,
      status: student.status,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email,
      notes: student.notes || '',
    });
  };

  const saveEdit = () => {
    if (!editingStudent) return;
    api.put(`/students/${editingStudent.id}`, editForm).then(() => {
      setEditingStudent(null);
      fetchStudents();
    });
  };

  const statusBadge = (status: string) => {
    const cls = status === 'Active' ? 'badge-green' : status === 'Graduated' ? 'badge-blue' : 'badge-red';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <div className="search-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by name or student ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>
        <select className="form-select" value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
          <option value="">All Classes</option>
          {['Grade 9-A', 'Grade 9-B', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Graduated">Graduated</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select className="form-select" value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }}>
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Students ({total})</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Enrollment</th>
                <th>Status</th>
                <th>Parent Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id_number}</td>
                  <td style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</td>
                  <td>{s.grade_class}</td>
                  <td>{new Date(s.enrollment_date).toLocaleDateString()}</td>
                  <td>{statusBadge(s.status)}</td>
                  <td style={{ fontSize: 13 }}>{s.parent_name || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewStudent(s.id)}><Eye size={14} /></button>
                      {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}><Edit2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* View Student Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {selectedStudent.student.first_name} {selectedStudent.student.last_name}
              </span>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                <div><strong>Student ID:</strong> {selectedStudent.student.student_id_number}</div>
                <div><strong>Class:</strong> {selectedStudent.student.grade_class}</div>
                <div><strong>Status:</strong> {statusBadge(selectedStudent.student.status)}</div>
                <div><strong>Enrolled:</strong> {selectedStudent.student.enrollment_date}</div>
                <div><strong>Email:</strong> {selectedStudent.student.email}</div>
                <div><strong>Parent:</strong> {selectedStudent.student.parent_name || '-'}</div>
                <div><strong>Parent Phone:</strong> {selectedStudent.student.parent_phone || '-'}</div>
                <div><strong>Parent Email:</strong> {selectedStudent.student.parent_email || '-'}</div>
              </div>
              {selectedStudent.student.notes && (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 14, marginBottom: 16 }}>
                  <strong>Notes:</strong> {selectedStudent.student.notes}
                </div>
              )}

              {selectedStudent.attendanceSummary?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Attendance Summary</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedStudent.attendanceSummary.map((a: any) => (
                      <span key={a.status} className={`badge ${a.status === 'Present' ? 'badge-green' : a.status === 'Absent' ? 'badge-red' : 'badge-yellow'}`}>
                        {a.status}: {a.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedStudent.recentGrades?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 8 }}>Recent Grades</h4>
                  <table>
                    <thead><tr><th>Subject</th><th>Title</th><th>Score</th><th>Date</th></tr></thead>
                    <tbody>
                      {selectedStudent.recentGrades.map((g: any) => (
                        <tr key={g.id}>
                          <td>{g.subject_name}</td>
                          <td>{g.title}</td>
                          <td>{g.score}/{g.max_score}</td>
                          <td>{new Date(g.date).toLocaleDateString()}</td>
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit Student: {editingStudent.first_name} {editingStudent.last_name}</span>
              <button className="modal-close" onClick={() => setEditingStudent(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <input className="form-input" value={editForm.grade_class} onChange={e => setEditForm({ ...editForm, grade_class: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Name</label>
                <input className="form-input" value={editForm.parent_name} onChange={e => setEditForm({ ...editForm, parent_name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" value={editForm.parent_phone} onChange={e => setEditForm({ ...editForm, parent_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Email</label>
                  <input className="form-input" value={editForm.parent_email} onChange={e => setEditForm({ ...editForm, parent_email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingStudent(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
