import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface FeedForm {
  code: string;
  name: string;
  unit: string;
  min_stock_level: string;
  max_stock_level: string;
  purchase_price: string;
  notes: string;
}

const initialForm: FeedForm = {
  code: '',
  name: '',
  unit: 'kg',
  min_stock_level: '',
  max_stock_level: '',
  purchase_price: '',
  notes: '',
};

export default function FeedManagement() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<FeedForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ['feed-items'],
    queryFn: () => client.get('/stock/feed').then(r => r.data.data || []),
  });

  const items = Array.isArray(feedItems) ? feedItems : [];
  const filtered = search
    ? items.filter((i: any) =>
        [i.code, i.name, i.unit, i.notes].some(v => v?.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editing
        ? client.put(`/stock/feed/${editing.id}`, data)
        : client.post('/stock/feed', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-items'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/stock/feed/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed-items'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      code: item.code || '',
      name: item.name || '',
      unit: item.unit || 'kg',
      min_stock_level: item.min_stock_level?.toString() || '',
      max_stock_level: item.max_stock_level?.toString() || '',
      purchase_price: item.purchase_price?.toString() || '',
      notes: item.notes || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: any = { name: form.name, unit: form.unit, notes: form.notes || undefined };
    if (form.min_stock_level) payload.min_stock_level = Number(form.min_stock_level);
    if (form.max_stock_level) payload.max_stock_level = Number(form.max_stock_level);
    if (form.purchase_price) payload.purchase_price = Number(form.purchase_price);
    createMutation.mutate(payload);
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Code', render: (i: any) => i.code || '-' },
    { key: 'name', label: 'Name' },
    { key: 'unit', label: 'Unit', render: (i: any) => i.unit || '-' },
    { key: 'min_stock_level', label: 'Min Stock', render: (i: any) => i.min_stock_level ?? '-' },
    { key: 'max_stock_level', label: 'Max Stock', render: (i: any) => i.max_stock_level ?? '-' },
    {
      key: 'purchase_price', label: 'Purchase Price',
      render: (i: any) => i.purchase_price != null ? Number(i.purchase_price).toLocaleString() : '-',
    },
    { key: 'notes', label: 'Notes', render: (i: any) => i.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (i: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(i)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={async () => { if (await confirm('Delete this feed item?')) deleteMutation.mutate(i.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Feed Management"
      subtitle="Manage feed items"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Feed Item
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="form-input"
            placeholder="Search feed items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No feed items found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 520, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Feed Item' : 'Add Feed Item'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Code">
                <input value={form.code} disabled style={{ opacity: 0.6 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Auto-generated on create</p>
              </FormField>
              <FormField label="Name" required error={errors.name}>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </FormField>
              <div className="form-row">
                <FormField label="Unit" required>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} required>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lbs">lbs</option>
                    <option value="tonnes">tonnes</option>
                    <option value="bags">Bags</option>
                    <option value="litres">Litres</option>
                  </select>
                </FormField>
                <FormField label="Purchase Price">
                  <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Min Stock Level">
                  <input type="number" value={form.min_stock_level} onChange={e => setForm(p => ({ ...p, min_stock_level: e.target.value }))} />
                </FormField>
                <FormField label="Max Stock Level">
                  <input type="number" value={form.max_stock_level} onChange={e => setForm(p => ({ ...p, max_stock_level: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
