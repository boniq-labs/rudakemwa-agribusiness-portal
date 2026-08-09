import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { uploadApi, authApi } from '../api';
import { resolveAssetUrl } from '../utils/assetUrl';
import { Moon, Sun, Settings as SettingsIcon, Save, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const isAdmin = user?.role === 'farm_owner' || user?.role === 'owner' || user?.role === 'admin';

  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '' });
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
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
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
            <h3>System Settings</h3>
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
          <h3><User size={16} /> Profile Information</h3>
          <div className="form-group">
            <label>Profile Photo</label>
            <div className="setting-upload-row">
              {(profilePic ? URL.createObjectURL(profilePic) : user?.photo) ? <img src={profilePic ? URL.createObjectURL(profilePic) : resolveAssetUrl(user?.photo)} alt="profile" className="setting-thumb" /> : null}
              <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)} />
            </div>
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
          <h3><Lock size={16} /> Change Password</h3>
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
