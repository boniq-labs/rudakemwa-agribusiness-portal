import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import toast from 'react-hot-toast';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import type { Column } from '../../components/DataTable';
import { Plus, Sun, Edit2 } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';

const initialForm = { collection_date: new Date().toISOString().split('T')[0], collector_name: '', quantity_liters: '', number_of_animals: '', notes: '' };

export default function MorningProduction() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['milk-morning'],
    queryFn: () => client.get('/milk/collections', { params: { time: 'morning', limit: 100 } }).then(r => r.data.data || []),
  });

  const collections = Array.isArray(data) ? data : [];

  const totalLiters = collections.reduce((s: number, c: any) => s + Number(c.quantity_liters || 0), 0);

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/milk/collections', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-morning'] });
      setShowModal(false);
      setForm(initialForm);
      toast.success('Morning production recorded');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to record morning production'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/milk/collections/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-morning'] });
      setShowModal(false);
      setEditingId(null);
      setForm(initialForm);
      toast.success('Record updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/milk/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-morning'] });
      toast.success('Record deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete record'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      collection_date: form.collection_date,
      time: 'morning',
      collector_name: form.collector_name,
      quantity_liters: Number(form.quantity_liters),
      number_of_animals: form.number_of_animals ? Number(form.number_of_animals) : undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (c: any) => {
    setForm({ collection_date: c.collection_date || new Date().toISOString().split('T')[0], collector_name: c.collector_name || '', quantity_liters: String(c.quantity_liters || ''), number_of_animals: String(c.number_of_animals || ''), notes: c.notes || '' });
    setEditingId(c.id);
    setShowModal(true);
  };

  const columns: Column<any>[] = [
    { key: 'collection_date', label: 'Date', render: (c: any) => c.collection_date ? new Date(c.collection_date).toLocaleDateString() : '-' },
    { key: 'collector_name', label: 'Collector', render: (c: any) => c.collector_name || c.collector_id || '-' },
    { key: 'quantity_liters', label: 'Litres', render: (c: any) => `${c.quantity_liters}L` },
    { key: 'number_of_animals', label: 'Animals', render: (c: any) => c.number_of_animals != null ? c.number_of_animals : '-' },
    { key: 'notes', label: 'Notes', render: (c: any) => c.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (c: any) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={() => openEdit(c)} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm btn-danger" onClick={async () => { if (await confirm('Delete?')) deleteMutation.mutate(c.id); }} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Morning Production"
      subtitle="Record morning milk production"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}><Plus size={16} /> Record Morning</button>}
    >
      <div className="stats-grid">
        <StatsCard title="Total Litres" value={`${totalLiters.toFixed(1)} L`} icon={Sun} color="#eab308" />
        <StatsCard title="Records" value={collections.length} icon={Sun} color="#eab308" />
      </div>
      <DataTable columns={columns} data={collections} loading={isLoading} emptyMessage="No morning records" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500 }}>
            <h3 style={{ marginBottom: 20 }}>{editingId ? 'Edit Morning Production' : 'Record Morning Production'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.collection_date} onChange={e => setForm(p => ({ ...p, collection_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Collector Name *</label>
                <input className="form-input" type="text" value={form.collector_name} onChange={e => setForm(p => ({ ...p, collector_name: e.target.value }))} placeholder="Enter collector name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Litres *</label>
                <input className="form-input" type="number" step="0.1" value={form.quantity_liters} onChange={e => setForm(p => ({ ...p, quantity_liters: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Animals</label>
                <input className="form-input" type="number" step="1" value={form.number_of_animals} onChange={e => setForm(p => ({ ...p, number_of_animals: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" onClick={() => { setShowModal(false); setEditingId(null); setForm(initialForm); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
