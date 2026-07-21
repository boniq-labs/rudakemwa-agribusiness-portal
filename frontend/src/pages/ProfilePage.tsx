import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api';
import { ROLE_LABELS } from '../utils/constants';
import { User, Mail, Phone, KeyRound, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
  });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg(''); setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      const d = res.data.data;
      const s = localStorage.getItem('token') ? localStorage : sessionStorage;
      s.setItem('user', JSON.stringify(d));
      setUser(d);
      setMsg('Profile updated successfully.');
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const savePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    if (pwd.newPassword.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    try {
      await authApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      setMsg('Password changed successfully.');
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="page profile-page">
      <h2>My Profile</h2>
      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="profile-grid">
        <form className="card form-card" onSubmit={saveProfile}>
          <h3>Personal Information</h3>
          <div className="profile-id">
            <div className="profile-avatar-lg">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</div>
            <div>
              <div className="profile-id-name">{user?.firstName} {user?.lastName}</div>
              <div className="badge badge-info">{ROLE_LABELS[user?.role || ''] || user?.role}</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><User size={14} /> First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label><User size={14} /> Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label><Mail size={14} /> Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label><Phone size={14} /> Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
        </form>

        <form className="card form-card" onSubmit={savePwd}>
          <h3>Change Password</h3>
          <div className="form-group">
            <label><KeyRound size={14} /> Current Password</label>
            <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label><KeyRound size={14} /> New Password</label>
            <input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Update Password</button>
        </form>
      </div>
    </div>
  );
}
