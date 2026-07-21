import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, AlertTriangle, RotateCcw, Clock, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { milkAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

const COLORS = ['#ef4444', '#eab308', '#f97316', '#6366f1', '#3b82f6'];

interface WasteRecord {
  id: number;
  collection_id: number;
  quantity_liters: number;
  reason: string;
  waste_date: string;
  reported_by_name: string;
  notes: string;
}

interface FormData {
  collection_id: string;
  quantity_liters: string;
  reason: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  collection_id: '',
  quantity_liters: '',
  reason: 'spoiled',
  notes: '',
};

export default function MilkWaste() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['milk-waste'],
    queryFn: async () => {
      const res = await milkAPI.getWaste({});
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => milkAPI.createWaste(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-waste'] });
      closeModal();
      toast.success('Waste record created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => milkAPI.updateWaste(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-waste'] });
      closeModal();
      toast.success('Waste record updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => milkAPI.deleteWaste(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-waste'] });
      toast.success('Waste record deleted');
    },
    onError: () => toast.error('Failed to delete waste record'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: WasteRecord) => {
    setForm({
      collection_id: String(item.collection_id),
      quantity_liters: String(item.quantity_liters),
      reason: item.reason,
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const records: WasteRecord[] = data || [];
  const totalWaste = records.reduce((s, r) => s + r.quantity_liters, 0);
  const spoiled = records.filter((r) => r.reason === 'spoiled').reduce((s, r) => s + r.quantity_liters, 0);
  const storageFailure = records.filter((r) => r.reason === 'storage_failure' || r.reason === 'storage failure').reduce((s, r) => s + r.quantity_liters, 0);
  const expired = records.filter((r) => r.reason === 'expired').reduce((s, r) => s + r.quantity_liters, 0);

  const wasteByReason: Record<string, number> = records.reduce<Record<string, number>>((acc, r) => {
    const reason = r.reason.replace(/_/g, ' ');
    acc[reason] = (acc[reason] || 0) + r.quantity_liters;
    return acc;
  }, {});
  const pieData = Object.entries(wasteByReason).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      collection_id: parseInt(form.collection_id) || undefined,
      quantity_liters: parseFloat(form.quantity_liters) || 0,
      reason: form.reason,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<WasteRecord>[] = [
    { key: 'collection_id', label: 'Collection', render: (r) => `#${r.collection_id}` },
    { key: 'quantity_liters', label: 'Quantity (L)', render: (r) => `${r.quantity_liters} L` },
    { key: 'reason', label: 'Reason', render: (r) => <StatusBadge status={r.reason} /> },
    { key: 'waste_date', label: 'Date' },
    { key: 'reported_by_name', label: 'Reported By' },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this waste record?')) deleteMutation.mutate(r.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Milk Waste"
      subtitle="Track milk waste and losses"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setShowModal(true); }}>
          <Plus size={16} /> New Waste
        </button>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Total Waste" value={`${totalWaste.toFixed(1)} L`} icon={Trash2} color="#ef4444" />
        <StatsCard title="Spoiled" value={`${spoiled.toFixed(1)} L`} icon={AlertTriangle} color="#eab308" />
        <StatsCard title="Storage Failure" value={`${storageFailure.toFixed(1)} L`} icon={RotateCcw} color="#f97316" />
        <StatsCard title="Expired" value={`${expired.toFixed(1)} L`} icon={Clock} color="#6366f1" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Waste by Reason</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Waste Records</h3>
          <DataTable columns={columns} data={records} loading={isLoading} />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingId ? 'Edit Waste Record' : 'Report Waste'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Collection ID</label>
                <input type="number" className="form-input" value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (Liters)</label>
                <input type="number" step="0.01" className="form-input" value={form.quantity_liters} onChange={(e) => setForm({ ...form, quantity_liters: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <select className="form-select" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  <option value="spoiled">Spoiled</option>
                  <option value="storage_failure">Storage Failure</option>
                  <option value="expired">Expired</option>
                  <option value="contamination">Contamination</option>
                  <option value="spillage">Spillage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Waste' : 'Report Waste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
