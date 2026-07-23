import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import client from '../../api/client';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

interface DriverForm {
  name: string;
  license_number: string;
  phone: string;
  status: string;
}

const initialForm: DriverForm = {
  name: '', license_number: '', phone: '', status: 'available',
};

const STATUS_OPTIONS = ['available', 'on_trip', 'sick', 'off_duty'];

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<DriverForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['logistics-drivers'],
    queryFn: () => client.get('/logistics/drivers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/logistics/drivers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Driver created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/logistics/drivers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Driver updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/drivers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Driver deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (drivers || []).filter((d: any) =>
    `${d.name} ${d.phone || ''} ${d.license_number || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setSearchParams(new URLSearchParams());
  };

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
      license_number: item.license_number || '',
      phone: item.phone || '',
      status: item.status || 'available',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleDelete = (item: any) => {
    if (window.confirm(`Delete driver "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { available: '#16a34a', on_trip: '#2563eb', sick: '#d97706', off_duty: '#6b7280' };
    return <span style={{ color: '#fff', background: colors[status] || '#6b7280', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>{status.replace(/_/g, ' ')}</span>;
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', render: (d: any) => d.phone || '-' },
    { key: 'license_number', label: 'License No.', render: (d: any) => d.license_number || '-' },
    { key: 'status', label: 'Status', render: (d: any) => statusBadge(d.status) },
    {
      key: 'actions', label: 'Actions',
      render: (d: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(d); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(d); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Drivers"
      subtitle="Manage drivers"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Driver
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No drivers found" />

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Driver' : 'New Driver'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <input name="name" value={form.name} onChange={handleChange} required />
          </FormField>
          <div className="form-row">
            <FormField label="License Number" required>
              <input name="license_number" value={form.license_number} onChange={handleChange} required />
            </FormField>
            <FormField label="Phone" required>
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </FormField>
          </div>
          <FormField label="Status">
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </ModulePage>
  );
}
