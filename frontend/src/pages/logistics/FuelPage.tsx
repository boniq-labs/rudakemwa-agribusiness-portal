import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatsCard from '../../components/StatsCard';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import client from '../../api/client';
import { Plus, Search, Edit2, Trash2, Fuel, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

interface FuelForm {
  vehicle_id: string;
  liters: string;
  cost: string;
  date: string;
  station: string;
}

const initialForm: FuelForm = {
  vehicle_id: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0], station: '',
};

export default function FuelPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState<FuelForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const { data: fuel, isLoading } = useQuery({
    queryKey: ['logistics-fuel', params],
    queryFn: () => client.get('/logistics/fuel', { params }).then(r => r.data.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['logistics-vehicles-all'],
    queryFn: () => client.get('/logistics/vehicles').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/logistics/fuel', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Fuel record created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/logistics/fuel/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Fuel record updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/fuel/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-fuel'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Fuel record deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const totalLiters = useMemo(() =>
    (fuel || []).reduce((sum: number, f: any) => sum + (Number(f.quantity) || 0), 0), [fuel]);
  const totalCost = useMemo(() =>
    (fuel || []).reduce((sum: number, f: any) => sum + (Number(f.cost) || 0), 0), [fuel]);

  const filtered = (fuel || []).filter((f: any) => {
    return `${f.fuel_type || ''} ${f.vehicle_name || ''}`.toLowerCase().includes(search.toLowerCase());
  });

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
      liters: String(item.quantity || ''),
      cost: String(item.cost || ''),
      date: item.date ? item.date.substring(0, 10) : new Date().toISOString().split('T')[0],
      station: item.fuel_type || '',
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
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : undefined,
      quantity: Number(form.liters),
      cost: Number(form.cost),
      date: form.date,
      fuel_type: form.station || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = async (item: any) => {
    if (await confirm('Delete this fuel record?')) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'vehicle_name', label: 'Vehicle',
      render: (f: any) => f.vehicle_name || '-',
    },
    { key: 'quantity', label: 'Liters', render: (f: any) => f.quantity ?? '-' },
    { key: 'cost', label: 'Cost', render: (f: any) => f.cost ? `RWF ${Number(f.cost).toLocaleString()}` : '-' },
    { key: 'date', label: 'Date', render: (f: any) => f.date ? new Date(f.date).toLocaleDateString() : '-' },
    { key: 'fuel_type', label: 'Station', render: (f: any) => f.fuel_type || '-' },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (f: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(f); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(f); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} />{deleteMutation.isPending && ' Deleting...'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Fuel Management"
      subtitle="Track fuel usage and costs"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Record Fuel
        </button>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Total Fuel" value={`${totalLiters.toFixed(1)} L`} icon={Fuel} color="var(--primary)" />
        <StatsCard title="Total Cost" value={`RWF ${Number(totalCost || 0).toLocaleString()}`} icon={DollarSign} color="var(--danger)" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="btn btn-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No fuel records found" />

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Fuel Record' : 'Record Fuel'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Vehicle" required>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required>
              <option value="">Select vehicle</option>
              {(vehicles || []).map((v: any) => (
                <option key={v.id} value={v.id}>{v.name || v.vehicle_name || v.plate_number}</option>
              ))}
            </select>
          </FormField>
          <div className="form-row">
            <FormField label="Liters" required>
              <input type="number" step="0.01" name="liters" value={form.liters} onChange={handleChange} required />
            </FormField>
            <FormField label="Cost" required>
              <input type="number" step="0.01" name="cost" value={form.cost} onChange={handleChange} required />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Date" required>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </FormField>
            <FormField label="Station">
              <input name="station" value={form.station} onChange={handleChange} placeholder="e.g. Shell, Total" />
            </FormField>
          </div>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>
    </ModulePage>
  );
}
