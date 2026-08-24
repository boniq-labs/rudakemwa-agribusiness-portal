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

interface LandAreaForm {
  name: string;
  area_size: string;
  location: string;
  description: string;
}

const initialForm: LandAreaForm = { name: '', area_size: '', location: '', description: '' };

export default function LandAreas() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<LandAreaForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: areas, isLoading } = useQuery({
    queryKey: ['land-areas'],
    queryFn: () => client.get('/crops/land').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/crops/land', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-areas'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
      toast.success('Land area created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/crops/land/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-areas'] });
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      setErrors({});
      toast.success('Land area updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/crops/land/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-areas'] });
      toast.success('Land area deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (areas || []).filter((a: any) =>
    `${a.name} ${a.location || ''} ${a.description || ''}`.toLowerCase().includes(search.toLowerCase())
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
    setForm({
      name: item.name,
      area_size: String(item.area_size || ''),
      location: item.location || '',
      description: item.description || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, area_size: form.area_size ? Number(form.area_size) : undefined };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = async (item: any) => {
    if (await confirm(`Delete land area "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'area_size', label: 'Area Size', render: (a: any) => a.area_size ? `${a.area_size} ha` : '-' },
    { key: 'location', label: 'Location', render: (a: any) => a.location || '-' },
    { key: 'description', label: 'Description', render: (a: any) => a.description || '-' },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (a: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(a); }}>
            <Edit2 size={14} />
          </button>
           <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }} disabled={deleteMutation.isPending}
             onClick={e => { e.stopPropagation(); handleDelete(a); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Land Areas"
      subtitle="Manage farm land areas"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Land Area
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search land areas..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No land areas found" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Land Area' : 'New Land Area'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required>
                <input name="name" value={form.name} onChange={handleChange} required />
              </FormField>
              <div className="form-row">
                <FormField label="Area Size (ha)" required>
                  <input type="number" name="area_size" value={form.area_size} onChange={handleChange} min={0} step="0.01" required />
                </FormField>
                <FormField label="Location">
                  <input name="location" value={form.location} onChange={handleChange} />
                </FormField>
              </div>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
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
