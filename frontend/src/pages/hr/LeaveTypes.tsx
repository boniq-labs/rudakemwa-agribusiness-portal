import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

const DEFAULT_TYPES = [
  { name: 'Annual Leave', description: 'Annual vacation leave', days_allowed: 30 },
  { name: 'Sick Leave', description: 'Medical and health-related leave', days_allowed: 14 },
  { name: 'Emergency Leave', description: 'Urgent unforeseen circumstances', days_allowed: 3 },
  { name: 'Maternity Leave', description: 'Maternity and childbirth leave', days_allowed: 90 },
  { name: 'Paternity Leave', description: 'Paternity leave for new fathers', days_allowed: 14 },
  { name: 'Compassionate Leave', description: 'Bereavement and family emergency leave', days_allowed: 5 },
  { name: 'Unpaid Leave', description: 'Leave without pay', days_allowed: 0 },
];

export default function LeaveTypesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', days_allowed: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: leaveTypes, isLoading } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => client.get('/hr/leave-types').then(r => r.data.data || r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? client.put(`/hr/leave-types/${editing.id}`, data)
      : client.post('/hr/leave-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      closeModal();
      toast.success(editing ? 'Leave type updated' : 'Leave type created');
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/hr/leave-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type deleted');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', description: '', days_allowed: '' });
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', days_allowed: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (lt: any) => {
    setEditing(lt);
    setForm({ name: lt.name, description: lt.description || '', days_allowed: String(lt.days_allowed) });
    setErrors({});
    setShowModal(true);
  };

  const handleSeed = async () => {
    for (const lt of DEFAULT_TYPES) {
      try {
        await client.post('/hr/leave-types', lt);
      } catch { }
    }
    queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    toast.success('Default leave types seeded');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    const days = Number(form.days_allowed);
    if (isNaN(days) || days < 0) {
      setErrors({ days_allowed: 'Valid days allowed is required' });
      return;
    }
    createMutation.mutate({ name: form.name.trim(), description: form.description.trim(), days_allowed: days });
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (d: any) => d.description || '-' },
    { key: 'days_allowed', label: 'Days Allowed', render: (d: any) => d.days_allowed ?? '-' },
    {
      key: 'actions', label: 'Actions',
      render: (d: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(d)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={() => { if (confirm('Delete this leave type?')) deleteMutation.mutate(d.id); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Leave Types"
      subtitle="Manage leave types and allocations"
      actions={
        <>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Leave Type
          </button>
          <button className="btn" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={handleSeed}>
            Seed Default Types
          </button>
        </>
      }
    >
      <DataTable columns={columns} data={leaveTypes || []} loading={isLoading} emptyMessage="No leave types found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required error={errors.name}>
                <input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </FormField>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </FormField>
              <FormField label="Days Allowed" required error={errors.days_allowed}>
                <input type="number" name="days_allowed" value={form.days_allowed} onChange={e => setForm(p => ({ ...p, days_allowed: e.target.value }))} required min={0} />
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
