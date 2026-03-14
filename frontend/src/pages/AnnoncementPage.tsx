import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Announcement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Megaphone, X } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target_role: 'all' });

  useEffect(() => {
    api.get<any>('/announcements').then(data => setAnnouncements(data.announcements));
  }, []);

  const createAnnouncement = async () => {
    await api.post('/announcements', form);
    setShowCreate(false);
    setForm({ title: '', content: '', target_role: 'all' });
    api.get<any>('/announcements').then(data => setAnnouncements(data.announcements));
  };

  const targetBadge = (role: string) => {
    const cls = role === 'all' ? 'badge-blue' : role === 'teacher' ? 'badge-yellow' : role === 'student' ? 'badge-green' : 'badge-gray';
    return <span className={`badge ${cls}`}>{role}</span>;
  };

  return (
    <div>
      {(user?.role === 'admin' || user?.role === 'teacher') && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Announcement
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {announcements.map(a => (
          <div key={a.id} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Megaphone size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{a.title}</h3>
                </div>
                {targetBadge(a.target_role)}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>{a.content}</p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Posted by {a.author_name} &middot; {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="empty-state"><p>No announcements yet</p></div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Announcement</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your announcement..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-select" value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })}>
                  <option value="all">Everyone</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="student">Students Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createAnnouncement} disabled={!form.title || !form.content}>Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
