import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

interface CropTypeForm {
  name: string;
  description: string;
  usage: string;
}

const initialForm: CropTypeForm = { name: '', description: '', usage: '' };

export default function CropTypes() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CropTypeForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: types, isLoading } = useQuery({
    queryKey: ['crop-types'],
    queryFn: () => client.get('/crops/types').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/crops/types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-types'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
      toast.success('Crop type created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/crops/types/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-types'] });
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      setErrors({});
      toast.success('Crop type updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/crops/types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-types'] });
      toast.success('Crop type deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (types || []).filter((t: any) =>
    `${t.name} ${t.description || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setSearchParams(new URLSearchParams());
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '', usage: item.usage || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = async (item: any) => {
    if (await confirm(`Delete crop type "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (t: any) => t.description || '-' },
    { key: 'usage', label: 'Usage', render: (t: any) => t.usage || '-' },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (t: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(t); }}>
            <Edit2 size={14} />
          </button>
           <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }} disabled={deleteMutation.isPending}
             onClick={e => { e.stopPropagation(); handleDelete(t); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Crop Types"
      subtitle="Manage crop type definitions"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Crop Type
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search crop types..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No crop types found" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Crop Type' : 'New Crop Type'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required>
                <input name="name" value={form.name} onChange={handleChange} required />
              </FormField>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
              </FormField>
              <FormField label="Usage">
                <input name="usage" value={form.usage} onChange={handleChange} placeholder="e.g. Grain, Fodder, Cash crop" />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
