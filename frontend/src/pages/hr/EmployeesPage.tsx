import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { usersAPI, departmentsAPI, positionsAPI } from '../../api/endpoints';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

interface EmployeeForm {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  department_id: string;
  role_id: string;
  position: string;
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<EmployeeForm>({ first_name: '', last_name: '', email: '', username: '', password: '', phone: '', department_id: '', role_id: '', position: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data),
  });

  const { data: positions } = useQuery({
    queryKey: ['positions-all'],
    queryFn: () => positionsAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? usersAPI.update(editing.id, data)
      : usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(editing ? 'Employee updated' : 'Employee created');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Operation failed');
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Employee deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const filtered = (users || []).filter((u: any) =>
    `${u.first_name} ${u.last_name} ${u.employee_code || ''} ${u.email || ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ first_name: '', last_name: '', email: '', username: '', password: '', phone: '', department_id: '', role_id: '', position: '' });
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ first_name: '', last_name: '', email: '', username: '', password: '', phone: '', department_id: '', role_id: '', position: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditing(user);
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      phone: user.phone || '',
      department_id: user.department_id?.toString() || '',
      role_id: user.role_id?.toString() || '',
      position: typeof user.position === 'object' ? user.position?.name || '' : user.position || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setErrors({ first_name: !form.first_name.trim() ? 'First name is required' : '', last_name: !form.last_name.trim() ? 'Last name is required' : '' });
      return;
    }
    const payload: any = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      username: form.username,
      phone: form.phone,
      department_id: form.department_id ? Number(form.department_id) : undefined,
      position: form.position,
    };
    if (!editing && form.password) payload.password = form.password;
    if (!editing) payload.password = form.password || 'default123';
    createMutation.mutate(payload);
  };

  const columns: Column<any>[] = [
    { key: 'employee_code', label: 'Employee Code' },
    {
      key: 'name', label: 'Name',
      render: (u: any) => `${u.first_name} ${u.last_name}`,
    },
    {
      key: 'department', label: 'Department',
      render: (u: any) => u.department_name || '-',
    },
    {
      key: 'position', label: 'Position',
      render: (u: any) => typeof u.position === 'object' ? u.position?.name : u.position || '-',
    },
    { key: 'phone', label: 'Phone', render: (u: any) => u.phone || '-' },
    { key: 'status', label: 'Status', render: (u: any) => <StatusBadge status={u.is_active != null ? (u.is_active ? 'active' : 'inactive') : 'active'} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (u: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); openEdit(u); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this employee?')) deleteMutation.mutate(u.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={(e) => { e.stopPropagation(); navigate(`/hr/employees/${u.id}`); }}>
            <Search size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Employees"
      subtitle="Manage all employees"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Employee
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }}
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No employees found" onRowClick={(u: any) => navigate(`/hr/employees/${u.id}`)} />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Employee' : 'New Employee'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="First Name" required error={errors.first_name}>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required />
                </FormField>
                <FormField label="Last Name" required error={errors.last_name}>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Email" required>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </FormField>
                <FormField label="Username" required>
                  <input name="username" value={form.username} onChange={handleChange} required />
                </FormField>
              </div>
              {!editing && (
                <FormField label="Password" required>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required />
                </FormField>
              )}
              <div className="form-row">
                <FormField label="Department">
                  <select name="department_id" value={form.department_id} onChange={handleChange}>
                    <option value="">Select department</option>
                    {(departments || []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Position">
                  <select name="position" value={form.position} onChange={handleChange}>
                    <option value="">Select position</option>
                    {(positions || []).map((p: any) => (
                      <option key={p.id} value={p.name || p.id}>{p.name || p.title}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Phone">
                <input name="phone" value={form.phone} onChange={handleChange} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
