import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Wheat, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAnimalSelect, animalSelectStateOptions } from '../../hooks/useAnimalSelect';

export default function Feeding() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', feed_type: '', quantity: '', unit: 'kg', date: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['feeding'],
    queryFn: async () => (await client.get('/feeding')).data.data || [],
  });

  const { data: reportData } = useQuery({
    queryKey: ['feeding-report'],
    queryFn: async () => (await client.get('/feeding/report')).data.data || [],
  });

  const animalSelect = useAnimalSelect();
  const animalsData = animalSelect.animals;

  const records = Array.isArray(data) ? data : [];
  const report = Array.isArray(reportData) ? reportData : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/feeding', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding'] });
      queryClient.invalidateQueries({ queryKey: ['feeding-report'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Feeding record created');
      closeModal();
    },
    onError: () => toast.error('Failed to save feeding record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/feeding/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding'] });
      queryClient.invalidateQueries({ queryKey: ['feeding-report'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Feeding record updated');
      closeModal();
    },
    onError: () => toast.error('Failed to update feeding record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/feeding/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding'] });
      queryClient.invalidateQueries({ queryKey: ['feeding-report'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Feeding record deleted');
    },
    onError: () => toast.error('Failed to delete feeding record'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ animal_id: '', feed_type: '', quantity: '', unit: 'kg', date: new Date().toISOString().split('T')[0] });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ animal_id: '', feed_type: '', quantity: '', unit: 'kg', date: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      feed_type: item.feed_type || '',
      quantity: String(item.quantity || ''),
      unit: item.unit || 'kg',
      date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      feed_type: form.feed_type,
      quantity: Number(form.quantity),
      unit: form.unit,
      date: form.date,
      recorded_by: editingId ? undefined : user?.id,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    { key: 'feed_type', label: 'Feed Type' },
    {
      key: 'quantity', label: 'Quantity',
      render: (item: any) => `${item.quantity} ${item.unit || ''}`,
    },
    {
      key: 'date', label: 'Date',
      render: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    {
      key: 'recorded_by', label: 'Recorded By',
      render: (item: any) => item.recorded_by_name || item.recorded_by || '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this feeding record?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const consumptionData = report.length > 0
    ? report
    : Object.entries(
        records.reduce((acc: Record<string, number>, r: any) => {
          acc[r.feed_type] = (acc[r.feed_type] || 0) + Number(r.quantity || 0);
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }));

  return (
    <ModulePage
      title="Feeding Management"
      subtitle="Track animal feeding records"
      actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Feeding Record</button>}
    >
      <DataTable columns={columns} data={records} loading={isLoading} />

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Feed Consumption Report</h3>
        {consumptionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consumptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-secondary">No consumption data</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Wheat size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Feeding Record</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label} value={o.value} disabled>{o.label}</option>)}
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Feed Type *</label>
                <input className="form-input" value={form.feed_type} onChange={e => setForm(p => ({ ...p, feed_type: e.target.value }))} placeholder="e.g. Hay, Silage, Grain" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input className="form-input" type="number" step="0.01" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lbs">lbs</option>
                    <option value="tonnes">tonnes</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
