import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { uploadApi, authApi } from '../api';
import client from '../api/client';
import { resolveAssetUrl } from '../utils/assetUrl';
import { Moon, Sun, Settings as SettingsIcon, Save, User, Lock, Users as UsersIcon, KeyRound, UserX, UserCheck, Clock, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const isAdmin = user?.role === 'farm_owner' || user?.role === 'owner' || user?.role === 'admin';

  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '', username: '' });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '', username: user.username || '' });
    }
  }, [user]);

  const applyDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('theme', v ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
  }, []);

  const handleUpload = async (key: string, file: File | null) => {
    if (!file) return;
    try {
      const res = await uploadApi.upload(file);
      const url = res.data.data.url;
      setLocalSettings(prev => ({ ...prev, [key]: url }));
      await updateSettings({ [key]: url });
      toast.success(`${key === 'farm_logo' ? 'Logo' : 'Favicon'} uploaded`);
    } catch { toast.error('Upload failed'); }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      let photo = undefined;
      if (profilePic) {
        const res = await uploadApi.upload(profilePic);
        photo = res.data.data.url;
      }
      const payload: any = { ...profileForm };
      if (photo) payload.photo = photo;
      const res = await authApi.updateProfile(payload);
      const updated = res.data.data;
      if (updated) {
        setUser(updated);
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updated));
      }
      toast.success(res.data?.message || 'Profile updated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword) return toast.error('Enter current password');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setChangingPw(false); }
  };

  return (
    <div className="page settings-page">
      <h2><SettingsIcon size={20} /> Settings</h2>

      <div className="settings-grid">
        {isAdmin && (
          <div className="card form-card">
            <h3><SettingsIcon size={16} /> System Settings</h3>
            <div className="form-group">
              <label>System Name</label>
              <input value={localSettings.system_name} onChange={(e) => setLocalSettings({ ...localSettings, system_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Farm Name</label>
              <input value={localSettings.farm_name} onChange={(e) => setLocalSettings({ ...localSettings, farm_name: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Change Logo</label>
                <div className="setting-upload-row">
                  {localSettings.farm_logo && <img src={resolveAssetUrl(localSettings.farm_logo)} alt="logo" className="setting-thumb" />}
                  <input type="file" accept="image/*" onChange={(e) => handleUpload('farm_logo', e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="form-group">
                <label>Change Favicon</label>
                <div className="setting-upload-row">
                  {localSettings.favicon && <img src={resolveAssetUrl(localSettings.favicon)} alt="favicon" className="setting-thumb" />}
                  <input type="file" accept="image/*" onChange={(e) => handleUpload('favicon', e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Farm Address</label>
              <textarea rows={2} value={localSettings.farm_address} onChange={(e) => setLocalSettings({ ...localSettings, farm_address: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
              <label>Phone Number</label>
              <input value={localSettings.phone_number} onChange={(e) => setLocalSettings({ ...localSettings, phone_number: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>System Information</label>
              <textarea rows={2} value={localSettings.system_info} onChange={(e) => setLocalSettings({ ...localSettings, system_info: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={saveSettings} disabled={loading}>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

        <div className="card form-card">
          <h3><User size={16} /> Profile</h3>
          <div className="form-group">
            <label>Profile Photo</label>
            <div className="setting-upload-row">
              {(profilePic ? URL.createObjectURL(profilePic) : user?.photo) ? <img src={profilePic ? URL.createObjectURL(profilePic) : resolveAssetUrl(user?.photo)} alt="profile" className="setting-thumb" /> : null}
              <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} autoComplete="username" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={savingProfile}>
            <Save size={16} /> {savingProfile ? 'Saving...' : 'Update Profile'}
          </button>
        </div>

        <div className="card form-card">
          <h3><Lock size={16} /> Security</h3>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={changePassword} disabled={changingPw}>
            <Lock size={16} /> {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </div>

        {isAdmin && <UserManagement />}

        <div className="card form-card">
          <h3><Moon size={16} /> Appearance</h3>
          <div className="setting-row" onClick={() => applyDark(!dark)}>
            <div>
              <div className="setting-label">Dark Mode</div>
              <div className="setting-sub">Toggle between light and dark theme</div>
            </div>
            <button className={`switch ${dark ? 'on' : ''}`} type="button" aria-label="toggle dark mode">
              {dark ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Admin Settings → User Management (Admin & Farm Owner only)
 * Change username · Reset password · Suspend / On Leave / Reactivate
 * Passwords are never displayed or returned — only set.
 * ==========================================================*/
function UserManagement() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<any>(null);
  const [newUsername, setNewUsername] = useState('');
  const [resetUser, setResetUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => client.get('/users', { params: { limit: 1000 } }).then(r => r.data.data || []),
  });
  const users: any[] = Array.isArray(data) ? data : [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['settings-users'] });

  const usernameMutation = useMutation({
    mutationFn: (d: any) => client.put(`/users/${d.userId}`, { username: d.username }),
    onSuccess: () => {
      invalidate();
      setEditUser(null);
      toast.success('Username updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update username'),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: any) => client.put(`/users/reset-password/${id}`, { password }),
    onSuccess: () => {
      invalidate();
      setResetUser(null);
      setNewPassword('');
      toast.success('Password reset');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reset password'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: any) => client.put(`/users/${id}/account-status`, { status }),
    onSuccess: (res: any) => {
      invalidate();
      toast.success(res.data?.message || 'Status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update status'),
  });

  const statusBadge = (u: any) => {
    if (!u.is_active) return <span className="badge badge-danger">Deactivated</span>;
    const s = u.account_status || 'active';
    if (s === 'suspended') return <span className="badge badge-danger">Suspended</span>;
    if (s === 'on_leave') return <span className="badge badge-warning">On Leave</span>;
    return <span className="badge badge-success">Active</span>;
  };

  return (
    <div className="card form-card" style={{ overflowX: 'auto' }}>
      <h3><UsersIcon size={16} /> User Management</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: -4 }}>
        Change usernames, reset passwords, suspend / place on leave / reactivate. Roles, departments and permissions are preserved.
      </p>
      <div className="table-container">
        <table className="table table-compact">
          <thead>
            <tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5}>Loading users…</td></tr>}
            {!isLoading && users.length === 0 && <tr><td colSpan={5}>No users found</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || '-'}</td>
                <td>{u.username}</td>
                <td>{u.role_slug || u.role || '-'}</td>
                <td>{statusBadge(u)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm"
                      title="Change username"
                      onClick={() => { setEditUser(u); setNewUsername(u.username || ''); }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Reset password (user will change it after login)"
                      onClick={() => { setResetUser(u); setNewPassword(''); }}
                    >
                      <KeyRound size={14} />
                    </button>
                    {me?.id !== u.id && (u.account_status || 'active') !== 'suspended' && (
                      <button className="btn btn-sm btn-danger" title="Suspend — blocks login and API access"
                        onClick={() => statusMutation.mutate({ id: u.id, status: 'suspended' })}
                        disabled={statusMutation.isPending}>
                        <UserX size={14} />
                      </button>
                    )}
                    {me?.id !== u.id && (u.account_status || 'active') !== 'on_leave' && (
                      <button className="btn btn-sm" title="Place on leave"
                        onClick={() => statusMutation.mutate({ id: u.id, status: 'on_leave' })}
                        disabled={statusMutation.isPending}>
                        <Clock size={14} />
                      </button>
                    )}
                    {me?.id !== u.id && (u.account_status || 'active') !== 'active' && (
                      <button className="btn btn-sm btn-primary" title="Reactivate — restores roles, departments and permissions"
                        onClick={() => statusMutation.mutate({ id: u.id, status: 'active' })}
                        disabled={statusMutation.isPending}>
                        <UserCheck size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Change username modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card form-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: 16 }}>
            <h3><Pencil size={16} /> Change Username — {`${editUser.first_name || ''} ${editUser.last_name || ''}`.trim()}</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (!newUsername.trim()) return; usernameMutation.mutate({ userId: editUser.id, username: newUsername.trim() }); }}>
              <div className="form-group">
                <label>New Username</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoComplete="username" required />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Usernames must be unique across the system.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={usernameMutation.isPending}>
                  {usernameMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card form-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: 16 }}>
            <h3><KeyRound size={16} /> Reset Password — {`${resetUser.first_name || ''} ${resetUser.last_name || ''}`.trim()}</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; } resetMutation.mutate({ id: resetUser.id, password: newPassword }); }}>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={6} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                The password is stored securely (hashed). It is never displayed again.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setResetUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? 'Saving…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
