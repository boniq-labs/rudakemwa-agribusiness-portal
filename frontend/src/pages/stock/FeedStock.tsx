import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { stockAPI } from '../../api/endpoints';
import { Plus, X, Wheat, ClipboardList, AlertTriangle, UtensilsCrossed, Edit2, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

interface FeedForm { name: string; category: string; quantity: string; unit: string; expiry_date: string; supplier_name: string; }
interface ConsumeForm { feed_item_id: string; quantity: string; date: string; notes: string; }

const initialForm: FeedForm = { name: '', category: '', quantity: '', unit: 'kg', expiry_date: '', supplier_name: '' };
const initialConsume: ConsumeForm = { feed_item_id: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' };

const FEED_CATEGORIES = ['Grass', 'Hay', 'Silage', 'Concentrate', 'Grains', 'Supplements', 'Other'];

export default function FeedStock() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showConsume, setShowConsume] = useState(false);
  const [form, setForm] = useState<FeedForm>(initialForm);
  const [consumeForm, setConsumeForm] = useState<ConsumeForm>(initialConsume);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: feed, isLoading } = useQuery({ queryKey: ['stock-feed'], queryFn: () => stockAPI.getFeed().then(r => r.data.data || []) });
  const { data: consumption } = useQuery({ queryKey: ['stock-feed-consumption'], queryFn: () => stockAPI.getFeedConsumption().then(r => r.data.data || []) });

  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['stock-dashboard-stats'] });

  const createMutation = useMutation({
    mutationFn: (data: any) => stockAPI.createFeed(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-feed'] }); invalidateDashboard(); closeModal(); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to create feed' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stockAPI.updateFeed(data.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-feed'] }); invalidateDashboard(); closeModal(); toast.success('Feed updated'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to update feed' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stockAPI.deleteFeed(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-feed'] }); invalidateDashboard(); toast.success('Feed deleted'); },
    onError: () => toast.error('Failed to delete feed'),
  });

  const consumeMutation = useMutation({
    mutationFn: (data: any) => stockAPI.recordConsumption(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-feed-consumption'] }); queryClient.invalidateQueries({ queryKey: ['stock-feed'] }); invalidateDashboard(); setShowConsume(false); setConsumeForm(initialConsume); setErrors({}); toast.success('Consumption recorded'); },
    onError: (err: any) => { setErrors({ consume: err.response?.data?.message || 'Failed to record consumption' }); toast.error('Failed to record consumption'); },
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const openEdit = (item: any) => {
    setForm({ name: item.name || '', category: item.category || '', quantity: String(item.quantity || 0), unit: item.unit || 'kg', expiry_date: item.expiry_date || '', supplier_name: item.supplier_name || '' });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConsumeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setConsumeForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload = { ...form, quantity: form.quantity ? Number(form.quantity) : 0, supplier_name: form.supplier_name || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleConsumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    consumeMutation.mutate({
      feed_item_id: Number(consumeForm.feed_item_id),
      quantity: Number(consumeForm.quantity),
      date: consumeForm.date,
      notes: consumeForm.notes,
    });
  };

  const totalFeed = (feed || []).reduce((s: number, f: any) => s + Number(f.quantity || 0), 0);
  const lowAlertCount = (feed || []).filter((f: any) => {
    const qty = Number(f.quantity || 0);
    const min = Number(f.min_stock_level || 0);
    return min > 0 && qty <= min;
  }).length;

  const consumptionByCat: Record<string, number> = {};
  (consumption || []).forEach((c: any) => {
    const cat = c.feed_category || c.category || 'Other';
    consumptionByCat[cat] = (consumptionByCat[cat] || 0) + Number(c.quantity || 0);
  });
  const chartData = Object.entries(consumptionByCat).map(([name, value]) => ({ name, value }));

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name', render: (f: any) => f.name || '-' },
    { key: 'category', label: 'Category', render: (f: any) => f.category || '-' },
    { key: 'quantity', label: 'Quantity', render: (f: any) => f.quantity != null ? f.quantity : '-' },
    { key: 'unit', label: 'Unit', render: (f: any) => f.unit || '-' },
    { key: 'expiry_date', label: 'Expiry', render: (f: any) => f.expiry_date || '-' },
    { key: 'supplier_name', label: 'Supplier', render: (f: any) => f.supplier_name || '-' },
    { key: 'actions', label: 'Actions', render: (f: any) => (
      <div className="actions">
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(f); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this feed item?')) deleteMutation.mutate(f.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <ModulePage title="Feed Stock" subtitle="Manage feed inventory and consumption"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }} onClick={() => { setShowConsume(true); setErrors({}); }}>
            <UtensilsCrossed size={16} /> Record Consumption
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); setErrors({}); }}>
            <Plus size={16} /> New Feed
          </button>
        </div>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Total Feed" value={totalFeed} icon={Wheat} color="#2563eb" />
        <StatsCard title="Available Items" value={(feed || []).length} icon={ClipboardList} color="#16a34a" />
        <StatsCard title="Low Alerts" value={lowAlertCount} icon={AlertTriangle} color="#dc2626" />
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Consumption by Category</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" name="Consumed" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={feed || []} loading={isLoading} emptyMessage="No feed items" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 520, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Feed' : 'New Feed'}</h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Name" required>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </FormField>
                <FormField label="Category" required>
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {FEED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Quantity" required>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
                </FormField>
                <FormField label="Unit" required>
                  <select name="unit" value={form.unit} onChange={handleChange} required>
                    <option value="kg">kg</option>
                    <option value="bags">Bags</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="litres">Litres</option>
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Expiry Date">
                  <input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} />
                </FormField>
                <FormField label="Supplier">
                  <input type="text" name="supplier_name" value={form.supplier_name} onChange={handleChange} placeholder="Enter supplier name" />
                </FormField>
              </div>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Feed' : 'Create Feed'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConsume && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowConsume(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 480, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Consumption</h2>
              <button onClick={() => setShowConsume(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleConsumeSubmit}>
              <FormField label="Feed Item" required>
                <select name="feed_item_id" value={consumeForm.feed_item_id} onChange={handleConsumeChange} required>
                  <option value="">Select feed</option>
                  {(feed || []).map((f: any) => <option key={f.id} value={f.id}>{f.name} ({f.quantity} {f.unit})</option>)}
                </select>
              </FormField>
              <div className="form-row">
                <FormField label="Quantity Used" required>
                  <input type="number" name="quantity" value={consumeForm.quantity} onChange={handleConsumeChange} required />
                </FormField>
                <FormField label="Date">
                  <input type="date" name="date" value={consumeForm.date} onChange={handleConsumeChange} />
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea name="notes" value={consumeForm.notes} onChange={handleConsumeChange} rows={2} />
              </FormField>
              {errors.consume && <div className="alert alert-error">{errors.consume}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowConsume(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={consumeMutation.isPending}>{consumeMutation.isPending ? 'Saving...' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
