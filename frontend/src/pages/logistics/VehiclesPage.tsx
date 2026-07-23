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

interface VehicleForm {
  name: string;
  plate_number: string;
  type_id: string;
  status: string;
  fuel_type: string;
  capacity: string;
}

const initialForm: VehicleForm = {
  name: '', plate_number: '', type_id: '', status: 'available', fuel_type: 'Diesel', capacity: '',
};

const STATUS_OPTIONS = ['available', 'in-use', 'maintenance', 'out-of-service', 'retired'];

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['logistics-vehicles'],
    queryFn: () => client.get('/logistics/vehicles').then(r => r.data.data),
  });

  const { data: types } = useQuery({
    queryKey: ['logistics-vehicle-types'],
    queryFn: () => client.get('/logistics/vehicle-types').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/logistics/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Vehicle created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/logistics/vehicles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Vehicle updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Vehicle deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (vehicles || []).filter((v: any) =>
    `${v.vehicle_name || v.name || ''} ${v.plate_number || ''} ${v.fuel_type || ''}`.toLowerCase().includes(search.toLowerCase())
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
      name: item.vehicle_name || item.name || '',
      plate_number: item.plate_number || '',
      type_id: String(item.type_id || (item.type?.id ?? '')),
      status: item.status || 'available',
      fuel_type: item.fuel_type || 'Diesel',
      capacity: String(item.capacity || ''),
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      type_id: form.type_id ? Number(form.type_id) : undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`Delete vehicle "${item.vehicle_name || item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { available: '#16a34a', 'in-use': '#2563eb', maintenance: '#dc2626', 'out-of-service': '#6b7280', retired: '#991b1b' };
    return <span style={{ color: '#fff', background: colors[status] || '#6b7280', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>{status.replace(/-/g, ' ')}</span>;
  };

  const columns: Column<any>[] = [
    { key: 'vehicle_name', label: 'Name', render: (v: any) => v.vehicle_name || v.name || '-' },
    { key: 'plate_number', label: 'Plate No.', render: (v: any) => v.plate_number || '-' },
    {
      key: 'type_name', label: 'Type',
      render: (v: any) => v.type_name || '-',
    },
    { key: 'fuel_type', label: 'Fuel', render: (v: any) => v.fuel_type || '-' },
    { key: 'capacity', label: 'Capacity', render: (v: any) => v.capacity ? `${v.capacity}` : '-' },
    { key: 'status', label: 'Status', render: (v: any) => statusBadge(v.status) },
    {
      key: 'actions', label: 'Actions',
      render: (v: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(v); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(v); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Vehicles"
      subtitle="Manage fleet vehicles"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Vehicle
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No vehicles found" />

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Vehicle' : 'New Vehicle'}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField label="Name" required>
              <input name="name" value={form.name} onChange={handleChange} required />
            </FormField>
            <FormField label="Plate Number" required>
              <input name="plate_number" value={form.plate_number} onChange={handleChange} required />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Type" required>
              <select name="type_id" value={form.type_id} onChange={handleChange} required>
                <option value="">Select type</option>
                {(types || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Fuel Type">
              <select name="fuel_type" value={form.fuel_type} onChange={handleChange}>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </FormField>
            <FormField label="Capacity">
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} />
            </FormField>
          </div>
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
