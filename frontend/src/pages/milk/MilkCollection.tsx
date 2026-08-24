import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { milkAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface Collection {
  id: number;
  collection_date: string;
  time: string;
  collector_name: string;
  branch_name: string;
  quantity_liters: number;
  number_of_animals: number;
  avg_per_animal: number;
  created_at: string;
}

interface FormData {
  collection_date: string;
  time: string;
  collector_id: string;
  branch_id: string;
  quantity_liters: string;
  number_of_animals: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  collection_date: new Date().toISOString().split('T')[0],
  time: 'morning',
  collector_id: '',
  branch_id: '',
  quantity_liters: '',
  number_of_animals: '',
  notes: '',
};

export default function MilkCollection() {
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['milk-collections', filterDate, activeTab],
    queryFn: async () => {
      const res = await milkAPI.getCollections({ date: filterDate, time: activeTab });
      const items: Collection[] = res.data.data || [];
      return items.map((c) => ({
        ...c,
        avg_per_animal: c.number_of_animals > 0 ? +(c.quantity_liters / c.number_of_animals).toFixed(2) : 0,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => milkAPI.createCollection(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milk-collections'] }); closeModal(); },
    onError: () => toast.error('Failed to create collection'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => milkAPI.updateCollection(data.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milk-collections'] }); closeModal(); toast.success('Collection updated'); },
    onError: () => toast.error('Failed to update collection'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => milkAPI.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milk-collections'] }); toast.success('Collection deleted'); },
    onError: () => toast.error('Failed to delete collection'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(INITIAL_FORM); };

  const openEdit = (c: any) => {
    setForm({ collection_date: c.collection_date || new Date().toISOString().split('T')[0], time: c.time || 'morning', collector_id: String(c.collector_id || ''), branch_id: String(c.branch_id || ''), quantity_liters: String(c.quantity_liters || ''), number_of_animals: String(c.number_of_animals || ''), notes: c.notes || '' });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      collection_date: form.collection_date,
      time: form.time,
      collector_id: parseInt(form.collector_id) || undefined,
      branch_id: parseInt(form.branch_id) || undefined,
      quantity_liters: parseFloat(form.quantity_liters) || 0,
      number_of_animals: parseInt(form.number_of_animals) || 0,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<Collection>[] = [
    { key: 'collection_date', label: 'Date' },
    { key: 'time', label: 'Time', render: (c) => <StatusBadge status={c.time} /> },
    { key: 'collector_name', label: 'Collector' },
    { key: 'quantity_liters', label: 'Quantity (L)', render: (c) => `${c.quantity_liters} L` },
    { key: 'number_of_animals', label: 'Animals' },
    { key: 'avg_per_animal', label: 'Avg/Animal', render: (c) => `${c.avg_per_animal} L` },
    { key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions', render: (c) => (
      <div className="actions">
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(c); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
        <button className="btn btn-sm" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this collection?')) deleteMutation.mutate(c.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <ModulePage
      title="Milk Collection"
      subtitle="Record morning and evening milk collections"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setShowModal(true); }}>
          <Plus size={16} /> New Collection
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        <button
          style={{
            padding: '10px 24px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
            border: 'none', background: 'none', color: activeTab === 'morning' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'morning' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}
          onClick={() => setActiveTab('morning')}
        >
          Morning
        </button>
        <button
          style={{
            padding: '10px 24px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
            border: 'none', background: 'none', color: activeTab === 'evening' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'evening' ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2,
          }}
          onClick={() => setActiveTab('evening')}
        >
          Evening
        </button>
      </div>

      <DataTable columns={columns} data={data || []} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingId ? 'Edit Collection' : 'New Collection'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Collection Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.collection_date}
                  onChange={(e) => setForm({ ...form, collection_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <select className="form-select" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Collector ID</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.collector_id}
                  onChange={(e) => setForm({ ...form, collector_id: e.target.value })}
                  placeholder="Collector ID"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch ID</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  placeholder="Branch ID"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (Liters)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.quantity_liters}
                  onChange={(e) => setForm({ ...form, quantity_liters: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Animals</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.number_of_animals}
                  onChange={(e) => setForm({ ...form, number_of_animals: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Collection' : 'Save Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
