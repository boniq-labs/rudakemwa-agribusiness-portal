import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { positionsAPI, departmentsAPI } from '../../api/endpoints';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

export default function PositionsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', department_id: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: () => positionsAPI.getAll().then(r => r.data.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? positionsAPI.update(editing.id, data)
      : positionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => positionsAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', department_id: '', description: '' });
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', department_id: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (pos: any) => {
    setEditing(pos);
    setForm({
      name: pos.name,
      department_id: pos.department_id?.toString() || '',
      description: pos.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    const payload = {
      name: form.name,
      department_id: form.department_id ? Number(form.department_id) : undefined,
      description: form.description,
    };
    createMutation.mutate(payload);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Position' },
    {
      key: 'department', label: 'Department',
      render: (p: any) => {
        if (typeof p.department === 'object') return p.department?.name || '-';
        if (p.department_name) return p.department_name;
        const dept = (departments || []).find((d: any) => d.id === p.department_id);
        return dept?.name || '-';
      },
    },
    { key: 'description', label: 'Description', render: (p: any) => p.description || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(p)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={async () => { if (await confirm('Delete this position?')) deleteMutation.mutate(p.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Positions"
      subtitle="Manage job positions"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Position
        </button>
      }
    >
      <DataTable columns={columns} data={positions || []} loading={isLoading} emptyMessage="No positions found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Position' : 'Add Position'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Position Name" required error={errors.name}>
                <input name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </FormField>
              <FormField label="Department">
                <select name="department_id" value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}>
                  <option value="">Select department</option>
                  {(departments || []).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
