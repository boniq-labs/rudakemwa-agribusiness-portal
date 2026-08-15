import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

const STATUSES = ['planted', 'growing', 'harvested', 'failed'];

interface ActivityForm {
  crop_type_id: string;
  land_area_id: string;
  planting_date: string;
  harvest_date: string;
  quantity_planted: string;
  quantity_harvested: string;
  status: string;
  diseases: string;
  sales_amount: string;
  notes: string;
}

const initialForm: ActivityForm = {
  crop_type_id: '', land_area_id: '', planting_date: '', harvest_date: '',
  quantity_planted: '', quantity_harvested: '', status: 'planted',
  diseases: '', sales_amount: '', notes: '',
};

export default function CropActivities() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ActivityForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: activities, isLoading } = useQuery({
    queryKey: ['crop-activities'],
    queryFn: () => client.get('/crops/activities').then(r => r.data.data),
  });

  const { data: cropTypes } = useQuery({
    queryKey: ['crop-types'],
    queryFn: () => client.get('/crops/types').then(r => r.data.data),
  });

  const { data: landAreas } = useQuery({
    queryKey: ['land-areas'],
    queryFn: () => client.get('/crops/land').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/crops/activities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activities'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
      toast.success('Activity created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/crops/activities/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activities'] });
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      setErrors({});
      toast.success('Activity updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/crops/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-activities'] });
      toast.success('Activity deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (activities || []).filter((a: any) =>
    `${a.crop_name || ''} ${a.land_name || ''} ${a.status || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setSearchParams(new URLSearchParams());
    setShowModal(true);
  };

  const toDateStr = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d.substring(0, 10);
    if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return '';
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      crop_type_id: String(item.crop_type_id || ''),
      land_area_id: String(item.land_area_id || ''),
      planting_date: toDateStr(item.planting_date),
      harvest_date: toDateStr(item.harvest_date),
      quantity_planted: String(item.quantity_planted || ''),
      quantity_harvested: String(item.quantity_harvested || ''),
      status: item.status || 'planted',
      diseases: item.diseases || '',
      sales_amount: String(item.sales_amount || ''),
      notes: item.notes || '',
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
      crop_type_id: form.crop_type_id ? Number(form.crop_type_id) : undefined,
      land_area_id: form.land_area_id ? Number(form.land_area_id) : undefined,
      quantity_planted: form.quantity_planted ? Number(form.quantity_planted) : undefined,
      quantity_harvested: form.quantity_harvested ? Number(form.quantity_harvested) : undefined,
      sales_amount: form.sales_amount ? Number(form.sales_amount) : undefined,
      planting_date: form.planting_date || undefined,
      harvest_date: form.harvest_date || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = async (item: any) => {
    if (await confirm(`Delete this crop activity?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (a: any) => a.crop_name || '-' },
    { key: 'land_name', label: 'Land', render: (a: any) => a.land_name || '-' },
    { key: 'planting_date', label: 'Planting Date', render: (a: any) => a.planting_date ? new Date(a.planting_date).toLocaleDateString() : '-' },
    { key: 'harvest_date', label: 'Harvest Date', render: (a: any) => a.harvest_date ? new Date(a.harvest_date).toLocaleDateString() : '-' },
    { key: 'quantity_planted', label: 'Qty Planted', render: (a: any) => a.quantity_planted ?? '-' },
    { key: 'quantity_harvested', label: 'Qty Harvested', render: (a: any) => a.quantity_harvested ?? '-' },
    { key: 'status', label: 'Status', render: (a: any) => <StatusBadge status={a.status} /> },
    { key: 'diseases', label: 'Diseases', render: (a: any) => a.diseases || '-' },
    {
      key: 'sales_amount', label: 'Sales (RWF)',
      render: (a: any) => a.sales_amount ? `RWF ${Number(a.sales_amount).toLocaleString()}` : '-',
    },
    { key: 'notes', label: 'Notes', render: (a: any) => a.notes || '-' },
    {
      key: 'actions', label: 'Actions',
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
      title="Crop Activities"
      subtitle="Manage crop planting and harvesting activities"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Activity
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No activities found" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Activity' : 'New Activity'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Crop Type" required>
                  <select name="crop_type_id" value={form.crop_type_id} onChange={handleChange} required>
                    <option value="">Select crop type</option>
                    {(cropTypes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Land Area" required>
                  <select name="land_area_id" value={form.land_area_id} onChange={handleChange} required>
                    <option value="">Select land area</option>
                    {(landAreas || []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Planting Date">
                  <input type="date" name="planting_date" value={form.planting_date} onChange={handleChange} />
                </FormField>
                <FormField label="Harvest Date">
                  <input type="date" name="harvest_date" value={form.harvest_date} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Quantity Planted">
                  <input type="number" name="quantity_planted" value={form.quantity_planted} onChange={handleChange} min={0} step="0.01" />
                </FormField>
                <FormField label="Quantity Harvested">
                  <input type="number" name="quantity_harvested" value={form.quantity_harvested} onChange={handleChange} min={0} step="0.01" />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Status" required>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </FormField>
                <FormField label="Sales Amount (RWF)">
                  <input type="number" name="sales_amount" value={form.sales_amount} onChange={handleChange} min={0} step="0.01" />
                </FormField>
              </div>
              <FormField label="Diseases">
                <input name="diseases" value={form.diseases} onChange={handleChange} placeholder="e.g. Blight, Rust" />
              </FormField>
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
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
