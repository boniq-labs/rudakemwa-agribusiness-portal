import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { usersApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, UserPlus, Search, Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useConfirm } from '../components/ConfirmDialog';
import { resolveAssetUrl } from '../utils/assetUrl';

export default function UsersPage() {
  const confirm = useConfirm();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '', firstName: '', lastName: '', phone: '', position: '', roleId: 1, departmentId: 1, isActive: true, employee_code: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: async () => { const r = await usersApi.list(); return r.data.data; } });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => { const r = await client.get('/departments'); return r.data.data; },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await client.get('/roles')).data?.data || [],
  });
  const roles = Array.isArray(rolesData) ? rolesData : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setFormErrors({});
      const gen = r?.data?.data?.generatedPassword;
      const uname = r?.data?.data?.username;
      if (gen) toast.success(`User created!\nUsername: ${uname}\nPassword: ${gen}\nPlease share with the employee.`);
      setForm({ username: '', password: '', email: '', firstName: '', lastName: '', phone: '', position: '', roleId: 1, departmentId: 1, isActive: true, employee_code: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create user';
      toast.error(msg);
      const errors = err?.response?.data?.errors;
      if (errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(errors).forEach((key) => { fieldErrors[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key]; });
        setFormErrors(fieldErrors);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setEditingId(null);
      setFormErrors({});
      toast.success('User updated');
      setForm({ username: '', password: '', email: '', firstName: '', lastName: '', phone: '', position: '', roleId: 1, departmentId: 1, isActive: true, employee_code: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update user';
      toast.error(msg);
      const errors = err?.response?.data?.errors;
      if (errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(errors).forEach((key) => { fieldErrors[key] = Array.isArray(errors[key]) ? errors[key][0] : errors[key]; });
        setFormErrors(fieldErrors);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    },
  });

  const openEdit = (user: any) => {
    setEditingId(user.id);
    setForm({
      username: user.username || '',
      password: '',
      email: user.email || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      position: user.position || '',
      roleId: user.role_id || 1,
      departmentId: user.department_id || 1,
      isActive: !!user.is_active,
      employee_code: user.employee_code || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ username: '', password: '', email: '', firstName: '', lastName: '', phone: '', position: '', roleId: 1, departmentId: 1, isActive: true, employee_code: '' });
    setFormErrors({});
  };

  const autoFill = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    if (field === 'firstName' || field === 'lastName') {
      const fn = field === 'firstName' ? value : form.firstName;
      const ln = field === 'lastName' ? value : form.lastName;
      const full = fn + ln;
      const autoUsername = full.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      if (!form.username || form.username === (form.firstName + form.lastName).toLowerCase().replace(/\s+/g, '')) {
        next.username = autoUsername;
      }
      const autoCode = `EMP-${fn}${ln}`.toUpperCase().replace(/\s+/g, '');
      if (!form.employee_code || form.employee_code === `EMP-${form.firstName}${form.lastName}`.toUpperCase().replace(/\s+/g, '')) {
        next.employee_code = autoCode;
      }
    }
    if (field === 'phone') {
      if (!form.password) {
        const digits = value.replace(/\D/g, '');
        if (digits) next.password = `F@rm${digits}!`;
      }
    }
    setForm(next);
    if (formErrors[field]) {
      setFormErrors((prev) => { const copy = { ...prev }; delete copy[field]; return copy; });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const payload = { ...form, isActive: form.isActive ? 1 : 0 };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = users?.filter((u: any) =>
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2>Users</h2>
        {hasPermission('users.create') && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            <UserPlus size={18} /> Add User
          </button>
        )}
      </div>

      <div className="search-bar page-search">
        <Search size={18} />
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? 'Edit User' : 'Create New User'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label>First Name *</label><input required value={form.firstName} onChange={(e) => autoFill('firstName', e.target.value)} />
                {formErrors.firstName && <span className="field-error">{formErrors.firstName}</span>}</div>
              <div className="form-group"><label>Last Name *</label><input required value={form.lastName} onChange={(e) => autoFill('lastName', e.target.value)} />
                {formErrors.lastName && <span className="field-error">{formErrors.lastName}</span>}</div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Auto from name" /></div>
              <div className="form-group"><label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto from phone" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label>Phone *</label><input required value={form.phone} onChange={(e) => autoFill('phone', e.target.value)} />
                {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}</div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Position</label><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Farm Worker" /></div>
              <div className="form-group"><label>Employee Code</label><input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="Auto from name" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Status</label>
                <select value={form.isActive ? 1 : 0} onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div className="form-group"><label>Role</label>
                <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: parseInt(e.target.value) })}>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Department</label>
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: parseInt(e.target.value) })}>
                  {(departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <Loader2 size={18} className="spin" /> : null}
              {editingId ? updateMutation.isPending ? 'Updating...' : 'Update User' : createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Photo</th><th>Employee Name</th><th>Employee Code</th><th>Department</th><th>Position</th><th>Role</th><th>Status</th><th>Phone</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.length === 0 && <tr><td colSpan={9} className="text-center">No users found</td></tr>}
              {filtered?.map((u: any) => (
                <tr key={u.id}>
                  <td>{u.photo ? <img src={resolveAssetUrl(u.photo)} alt="" className="user-avatar-sm" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : <div className="user-avatar-sm">{u.first_name?.[0]}{u.last_name?.[0]}</div>}</td>
                  <td><div className="user-cell"><div className="user-avatar-sm" style={{ display: 'none' }}></div>{u.first_name} {u.last_name}</div></td>
                  <td>{u.employee_code || '-'}</td>
                  <td>{u.department_name || '-'}</td>
                  <td>{u.position || '-'}</td>
                  <td><span className="badge badge-info">{u.role_name}</span></td>
                  <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <div className="actions">
                      <a href={`/hr/employees/${u.id}`} className="btn btn-sm btn-ghost">View</a>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEdit(u)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={async () => { if (await confirm('Delete this user?')) deleteMutation.mutate(u.id); }} disabled={deleteMutation.isPending}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
