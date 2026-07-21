import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { logisticsAPI } from '../../api/endpoints';
import client from '../../api/client';
import { Plus, X, AlertTriangle, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

interface FormData {
  vehicle_id: string; maintenance_type: string; description: string;
  date: string; cost: string; service_provider: string; next_service_date: string;
}

const initialForm: FormData = {
  vehicle_id: '', maintenance_type: '', description: '',
  date: new Date().toISOString().split('T')[0], cost: '', service_provider: '', next_service_date: '',
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['logistics', 'maintenance'],
    queryFn: () => logisticsAPI.getMaintenance().then(r => r.data.data),
  });

  const { data: dueMaint } = useQuery({
    queryKey: ['logistics', 'maintenance', 'due'],
    queryFn: () => logisticsAPI.getDueMaintenance().then(r => r.data.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['logistics', 'vehicles', 'all'],
    queryFn: () => logisticsAPI.getVehicles().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => logisticsAPI.createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['logistics', 'maintenance', 'due'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create maintenance record' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/maintenance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['logistics', 'maintenance', 'due'] });
      toast.success('Maintenance record deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete maintenance record');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
    };
    createMutation.mutate(payload);
  };

  const columns: Column<any>[] = [
    {
      key: 'vehicle', label: 'Vehicle',
      render: (m: any) => (typeof m.vehicle === 'object' ? m.vehicle?.vehicle_name || m.vehicle?.plate_number : m.vehicle) || '-',
    },
    { key: 'maintenance_type', label: 'Type', render: (m: any) => m.maintenance_type || '-' },
    { key: 'description', label: 'Description', render: (m: any) => m.description || '-' },
    { key: 'date', label: 'Date', render: (m: any) => m.date ? new Date(m.date).toLocaleDateString() : '-' },
    { key: 'cost', label: 'Cost', render: (m: any) => m.cost ? Number(m.cost).toLocaleString() : '-' },
    { key: 'service_provider', label: 'Provider', render: (m: any) => m.service_provider || '-' },
    {
      key: 'next_service_date', label: 'Next Service',
      render: (m: any) => {
        if (!m.next_service_date) return '-';
        const next = new Date(m.next_service_date);
        const isOverdue = next < new Date();
        return (
          <span style={{ color: isOverdue ? 'var(--danger)' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
            {next.toLocaleDateString()} {isOverdue && <AlertTriangle size={12} style={{ verticalAlign: 'middle' }} />}
          </span>
        );
      },
    },
    {
      key: 'actions', label: '',
      render: (m: any) => (
        <div className="actions">
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this maintenance record?')) deleteMutation.mutate(m.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Maintenance"
      subtitle="Vehicle maintenance records and scheduling"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Maintenance
        </button>
      }
    >
      {dueMaint && dueMaint.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 'var(--radius)', marginBottom: 20, color: '#854d0e' }}>
          <AlertTriangle size={24} />
          <div>
            <strong>{dueMaint.length} vehicle{dueMaint.length > 1 ? 's' : ''} due for maintenance</strong>
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>Schedule service appointments as soon as possible.</div>
          </div>
        </div>
      )}

      {dueMaint && dueMaint.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} /> Due Maintenance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueMaint.slice(0, 5).map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>
                    {typeof m.vehicle === 'object' ? m.vehicle?.vehicle_name || m.vehicle?.plate_number : m.vehicle}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 8 }}>
                    {m.maintenance_type} &mdash; {m.next_service_date ? new Date(m.next_service_date).toLocaleDateString() : 'No date'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={maintenance || []} loading={isLoading} emptyMessage="No maintenance records found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Maintenance Record</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Vehicle" required>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
                  <option value="">Select vehicle</option>
                  {(vehicles || []).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.vehicle_name || v.plate_number}</option>
                  ))}
                </select>
              </FormField>
              <div className="form-row">
                <FormField label="Maintenance Type" required>
                  <select name="maintenance_type" value={form.maintenance_type} onChange={handleChange} required>
                    <option value="">Select type</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Replacement">Tire Replacement</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Engine Service">Engine Service</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Electrical">Electrical</option>
                    <option value="General Inspection">General Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </FormField>
                <FormField label="Date" required>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </FormField>
              </div>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
              </FormField>
              <div className="form-row">
                <FormField label="Cost">
                  <input type="number" step="0.01" name="cost" value={form.cost} onChange={handleChange} />
                </FormField>
                <FormField label="Service Provider">
                  <input name="service_provider" value={form.service_provider} onChange={handleChange} />
                </FormField>
              </div>
              <FormField label="Next Service Date">
                <input type="date" name="next_service_date" value={form.next_service_date} onChange={handleChange} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
