import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { departmentsAPI } from '../../api/endpoints';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? departmentsAPI.update(editing.id, data)
      : departmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentsAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', description: '' });
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (dept: any) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    createMutation.mutate(form);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (d: any) => d.description || '-' },
    { key: 'employee_count', label: 'Employees', render: (d: any) => d.employee_count ?? 0 },
    {
      key: 'actions', label: 'Actions',
      render: (d: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(d)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={() => { if (confirm('Delete this department?')) deleteMutation.mutate(d.id); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Departments"
      subtitle="Manage departments"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Department
        </button>
      }
    >
      <DataTable columns={columns} data={departments || []} loading={isLoading} emptyMessage="No departments found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required error={errors.name}>
                <input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </FormField>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
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
