import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { Plus, X, Edit2, Trash2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface FormData {
  name: string; brand: string; category: string; unit: string;
  quantity: string; unit_price: string; reorder_level: string;
  expiry_date: string; notes: string;
}

const initialForm: FormData = {
  name: '', brand: '', category: '', unit: 'pcs', quantity: '',
  unit_price: '', reorder_level: '', expiry_date: '', notes: '',
};

export default function MedicineStock() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: medicines, isLoading } = useQuery({ queryKey: ['stock-medicines'], queryFn: () => client.get('/stock/medicines').then(r => r.data.data || []) });
  const { data: expiring } = useQuery({ queryKey: ['stock-medicines-expiring'], queryFn: () => client.get('/stock/medicines/expiring').then(r => r.data.data || []) });
  const { data: expired } = useQuery({ queryKey: ['stock-medicines-expired'], queryFn: () => client.get('/stock/medicines/expired').then(r => r.data.data || []) });

  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['stock-dashboard-stats'] });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/stock/medicines', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-medicines'] }); invalidateDashboard(); closeModal(); toast.success('Medicine created'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to create medicine' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/stock/medicines/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-medicines'] }); invalidateDashboard(); closeModal(); toast.success('Medicine updated'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to update medicine' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/stock/medicines/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-medicines'] }); invalidateDashboard(); toast.success('Medicine deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      unit: form.unit,
      quantity: Number(form.quantity) || 0,
      unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      reorder_level: form.reorder_level ? Number(form.reorder_level) : undefined,
      expiry_date: form.expiry_date,
      notes: form.notes,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (item: any) => {
    setForm({
      name: item.name || '', brand: item.brand || '',
      category: typeof item.category === 'object' ? (item.category?.name || '') : (item.category || ''),
      unit: item.unit || 'pcs', quantity: String(item.quantity || 0),
      unit_price: String(item.unit_price || ''), reorder_level: String(item.reorder_level || ''),
      expiry_date: item.expiry_date || '', notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (item: any) => {
    if (await confirm(`Delete medicine "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const expiringCount = Array.isArray(expiring) ? expiring.length : 0;
  const expiredCount = Array.isArray(expired) ? expired.length : 0;

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'brand', label: 'Brand', render: (m: any) => m.brand || '-' },
    { key: 'category', label: 'Category', render: (m: any) => typeof m.category === 'object' ? m.category?.name : m.category || '-' },
    { key: 'quantity', label: 'Qty', render: (m: any) => `${m.quantity} ${m.unit || ''}` },
    { key: 'unit_price', label: 'Unit Price', render: (m: any) => m.unit_price ? `$${Number(m.unit_price).toFixed(2)}` : '-' },
    { key: 'reorder_level', label: 'Reorder', render: (m: any) => m.reorder_level || '-' },
    { key: 'expiry_date', label: 'Expiry', render: (m: any) => m.expiry_date || '-' },
    {
      key: 'status', label: 'Status',
      render: (m: any) => {
        if (!m.expiry_date) return <StatusBadge status="valid" />;
        const diff = new Date(m.expiry_date).getTime() - Date.now();
        if (diff < 0) return <StatusBadge status="expired" />;
        if (diff <= 30 * 24 * 60 * 60 * 1000) return <StatusBadge status="low" />;
        return <StatusBadge status="active" />;
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (m: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(m); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(m); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage title="Medicine Stock" subtitle="Manage medicine and veterinary supplies"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); setErrors({}); }}>
          <Plus size={16} /> New Medicine
        </button>
      }
    >
      {(expiringCount > 0 || expiredCount > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {expiringCount > 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 'var(--radius)', background: '#fef9c3', border: '1px solid #fde68a', color: '#854d0e' }}>
              <Clock size={20} />
              <span style={{ fontWeight: 600 }}>{expiringCount} medicine{expiringCount > 1 ? 's' : ''} expiring within 30 days</span>
            </div>
          )}
          {expiredCount > 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 'var(--radius)', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: 600 }}>{expiredCount} medicine{expiredCount > 1 ? 's' : ''} expired</span>
            </div>
          )}
        </div>
      )}

      <DataTable columns={columns} data={medicines || []} loading={isLoading} emptyMessage="No medicines found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Medicine' : 'New Medicine'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Name" required>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </FormField>
                <FormField label="Brand">
                  <input name="brand" value={form.brand} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Category" required>
                  <input name="category" value={form.category} onChange={handleChange} placeholder="Enter category" required />
                </FormField>
                <FormField label="Unit" required>
                  <select name="unit" value={form.unit} onChange={handleChange} required>
                    <option value="pcs">Pieces</option>
                    <option value="bottles">Bottles</option>
                    <option value="vials">Vials</option>
                    <option value="ml">mL</option>
                    <option value="tablets">Tablets</option>
                    <option value="sachets">Sachets</option>
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Quantity" required>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
                </FormField>
                <FormField label="Unit Price">
                  <input type="number" step="0.01" name="unit_price" value={form.unit_price} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Reorder Level">
                  <input type="number" name="reorder_level" value={form.reorder_level} onChange={handleChange} />
                </FormField>
                <FormField label="Expiry Date" required>
                  <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} required />
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Medicine' : 'Create Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
