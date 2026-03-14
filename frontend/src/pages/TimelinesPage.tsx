import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ActivityLog } from '../types';
import { ClipboardCheck, GraduationCap, Megaphone, UserPlus, Settings } from 'lucide-react';

const ACTION_CONFIG: Record<string, { icon: any; color: string; dotColor: string }> = {
  mark_attendance: { icon: ClipboardCheck, color: 'var(--success)', dotColor: 'green' },
  grade_submission: { icon: GraduationCap, color: 'var(--info)', dotColor: 'blue' },
  announcement: { icon: Megaphone, color: 'var(--warning)', dotColor: 'yellow' },
  register: { icon: UserPlus, color: 'var(--primary)', dotColor: '' },
  update: { icon: Settings, color: 'var(--text-secondary)', dotColor: '' },
  system_init: { icon: Settings, color: 'var(--text-muted)', dotColor: '' },
};

export default function TimelinePage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get<any>('/dashboard/stats').then(data => setActivities(data.recentActivity || []));
  }, []);

  const filtered = filter ? activities.filter(a => a.action === filter) : activities;

  return (
    <div>
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Activities</option>
          <option value="mark_attendance">Attendance Updates</option>
          <option value="grade_submission">Grade Submissions</option>
          <option value="announcement">Announcements</option>
          <option value="register">New Registrations</option>
          <option value="update">Profile Updates</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">School Activity Timeline</span></div>
        <div className="card-body">
          {filtered.length === 0 ? (
            <div className="empty-state"><p>No activities to display</p></div>
          ) : (
            <div className="timeline">
              {filtered.map(activity => {
                const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.update;
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="timeline-item">
                    <div className={`timeline-dot ${config.dotColor}`} />
                    <div className="timeline-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Icon size={14} style={{ color: config.color }} />
                        <h4>{activity.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h4>
                      </div>
                      <p>{activity.details}</p>
                      <div className="timeline-time">
                        By {activity.user_name} &middot; {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
