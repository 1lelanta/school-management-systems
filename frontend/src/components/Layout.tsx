import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck, GraduationCap,
  Calendar, Clock, Megaphone, CalendarDays, LogOut, Menu, X, School,
  Shield
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student'] },
  { path: '/students', label: 'Students', icon: Users, roles: ['admin', 'teacher'] },
  { path: '/classes', label: 'Classes', icon: BookOpen, roles: ['admin', 'teacher', 'student'] },
  { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
  { path: '/grades', label: 'Grades', icon: GraduationCap, roles: ['admin', 'teacher', 'student'] },
  { path: '/schedule', label: 'Schedule', icon: Clock, roles: ['admin', 'teacher', 'student'] },
  { path: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['admin', 'teacher', 'student'] },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['admin', 'teacher', 'student'] },
  { path: '/timeline', label: 'Timeline', icon: Calendar, roles: ['admin', 'teacher'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role || ''));
  const currentTitle = visibleNav.find(i => i.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <School size={24} />
          <span>SchoolMS</span>
          <button className="menu-toggle" onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', color: 'white' }}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <button
              key={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.firstName} {user?.lastName}</div>
          <div className="sidebar-role">{user?.role}</div>
          <button className="sidebar-link" onClick={logout} style={{ padding: '8px 0', marginTop: 8 }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
            <h1 className="header-title">{currentTitle}</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>

        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-logo">
                <School size={22} />
                <span>SchoolMS</span>
              </div>
              <p className="footer-tagline">
                Empowering educators and students with streamlined school management.
              </p>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-heading">Quick Links</h4>
              <nav className="footer-links">
                {[
                  { path: '/', label: 'Dashboard' },
                  { path: '/students', label: 'Students' },
                  { path: '/attendance', label: 'Attendance' },
                  { path: '/calendar', label: 'Calendar' },
                  { path: '/announcements', label: 'Announcements' },
                ].map(link => (
                  <button
                    key={link.path}
                    className="footer-link"
                    onClick={() => navigate(link.path)}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-heading">Academics</h4>
              <nav className="footer-links">
                {[
                  { path: '/classes', label: 'Classes' },
                  { path: '/grades', label: 'Grades' },
                  { path: '/schedule', label: 'Schedule' },
                  { path: '/timeline', label: 'Timeline' },
                ].map(link => (
                  <button
                    key={link.path}
                    className="footer-link"
                    onClick={() => navigate(link.path)}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="footer-links-group">
              <h4 className="footer-heading">Legal</h4>
              <nav className="footer-links">
                <button className="footer-link" onClick={() => {}}>Privacy Policy</button>
                <button className="footer-link" onClick={() => {}}>Terms of Service</button>
                <button className="footer-link" onClick={() => {}}>Data Protection</button>
              </nav>
            </div>
          </div>

          <div className="footer-bottom">
            <span className="footer-copyright">
              &copy; {new Date().getFullYear()} SchoolMS. All rights reserved.
            </span>
            <span className="footer-version">
              <Shield size={12} /> Version 1.0.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
