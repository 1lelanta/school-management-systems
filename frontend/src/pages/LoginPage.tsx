import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { School } from 'lucide-react';

export default function LoginPage() {
  const { login, register, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'student'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div className="stat-icon purple" style={{ width: 56, height: 56 }}>
            <School size={28} />
          </div>
        </div>
        <h1 className="auth-title">School Management System</h1>
        <p className="auth-subtitle">{isRegister ? 'Create your account' : 'Sign in to your account'}</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} required placeholder="you@school.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} required placeholder="Enter your password" />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set('role')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
            {isLoading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {!isRegister && (
          <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Demo Accounts:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>Admin (Bekele Tesfaye): admin@gmail.com / admin123</div>
                <button className="btn btn-sm" onClick={() => setForm({ ...form, email: 'admin@gmail.com', password: 'admin123' })}>Autofill</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>Teacher (Almaz Kebede): almaz.kebede@school.et / teacher123</div>
                <button className="btn btn-sm" onClick={() => setForm({ ...form, email: 'almaz.kebede@school.et', password: 'teacher123' })}>Autofill</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>Student (Amanuel Bekele): amanuel.bekele@student.school.et / student123</div>
                <button className="btn btn-sm" onClick={() => setForm({ ...form, email: 'amanuel.bekele@student.school.et', password: 'student123' })}>Autofill</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
