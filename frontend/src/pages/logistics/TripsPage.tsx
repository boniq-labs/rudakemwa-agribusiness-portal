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

interface TripForm {
  vehicle_id: string;
  driver_id: string;
  start_date: string;
  end_date: string;
  destination: string;
  purpose: string;
  status: string;
}

const initialForm: TripForm = {
  vehicle_id: '', driver_id: '', start_date: '', end_date: '',
  destination: '', purpose: '', status: 'scheduled',
};

const STATUS_OPTIONS = ['scheduled', 'started', 'in_progress', 'completed', 'cancelled'];

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<TripForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: trips, isLoading } = useQuery({
    queryKey: ['logistics-trips'],
    queryFn: () => client.get('/logistics/trips').then(r => r.data.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['logistics-vehicles-all'],
    queryFn: () => client.get('/logistics/vehicles').then(r => r.data.data),
  });

  const { data: drivers } = useQuery({
    queryKey: ['logistics-drivers-all'],
    queryFn: () => client.get('/logistics/drivers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/logistics/trips', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-trips'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Trip created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/logistics/trips/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-trips'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Trip updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/trips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-trips'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Trip deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (trips || []).filter((t: any) =>
    `${t.destination || ''} ${t.purpose || ''}`.toLowerCase().includes(search.toLowerCase())
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
      vehicle_id: String(item.vehicle_id || (item.vehicle?.id ?? '')),
      driver_id: String(item.driver_id || (item.driver?.id ?? '')),
      start_date: item.start_date ? (item.start_date.substring(0, 16) || '') : '',
      end_date: item.end_date ? (item.end_date.substring(0, 16) || '') : '',
      destination: item.destination || '',
      purpose: item.purpose || '',
      status: item.status || 'scheduled',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      driver_id: form.driver_id ? Number(form.driver_id) : undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`Delete trip #${item.id}?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { scheduled: '#6b7280', started: '#2563eb', in_progress: '#d97706', completed: '#16a34a', cancelled: '#dc2626' };
    return <span style={{ color: '#fff', background: colors[status] || '#6b7280', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>{status.replace(/_/g, ' ')}</span>;
  };

  const columns: Column<any>[] = [
    { key: 'id', label: '#', render: (t: any) => `#${t.id}` },
    { key: 'destination', label: 'Destination', render: (t: any) => t.destination || t.route || '-' },
    { key: 'purpose', label: 'Purpose', render: (t: any) => t.purpose || t.notes || '-' },
    {
      key: 'vehicle_name', label: 'Vehicle',
      render: (t: any) => t.vehicle_name || '-',
    },
    {
      key: 'driver_name', label: 'Driver',
      render: (t: any) => t.driver_name || '-',
    },
    { key: 'start_date', label: 'Start', render: (t: any) => t.start_date ? new Date(t.start_date).toLocaleDateString() : (t.start_time ? new Date(t.start_time).toLocaleDateString() : '-') },
    { key: 'end_date', label: 'End', render: (t: any) => t.end_date ? new Date(t.end_date).toLocaleDateString() : (t.end_time ? new Date(t.end_time).toLocaleDateString() : '-') },
    { key: 'status', label: 'Status', render: (t: any) => statusBadge(t.status) },
    {
      key: 'actions', label: 'Actions',
      render: (t: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(t); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(t); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Trips"
      subtitle="Manage trips"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Trip
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No trips found" />

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Trip' : 'New Trip'}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField label="Vehicle" required>
              <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                <option value="">Select vehicle</option>
                {(vehicles || []).map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name || v.vehicle_name || v.plate_number}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Driver" required>
              <select name="driver_id" value={form.driver_id} onChange={handleChange} required>
                <option value="">Select driver</option>
                {(drivers || []).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name || `${d.first_name || ''} ${d.last_name || ''}`}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Start Date" required>
              <input type="datetime-local" name="start_date" value={form.start_date} onChange={handleChange} required />
            </FormField>
            <FormField label="End Date">
              <input type="datetime-local" name="end_date" value={form.end_date} onChange={handleChange} />
            </FormField>
          </div>
          <FormField label="Destination" required>
            <input name="destination" value={form.destination} onChange={handleChange} required />
          </FormField>
          <FormField label="Purpose">
            <textarea name="purpose" value={form.purpose} onChange={handleChange} rows={2} />
          </FormField>
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
