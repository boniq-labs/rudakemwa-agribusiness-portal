import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Skull, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

const PIE_COLORS = ['#dc2626', '#d97706', '#2563eb', '#16a34a', '#8b5cf6', '#ec4899'];

export default function AnimalDeaths() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', date: new Date().toISOString().split('T')[0], cause: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['deaths'],
    queryFn: async () => (await client.get('/animals/deaths')).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data.data || [],
  });

  const deaths = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/deaths', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save death record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/deaths/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update death record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/deaths/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record deleted');
    },
    onError: () => toast.error('Failed to delete death record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', date: new Date().toISOString().split('T')[0], cause: '', notes: '' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      date: item.date ? item.date.split('T')[0] : '',
      cause: item.cause || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      date: form.date,
      cause: form.cause,
      notes: form.notes || undefined,
      recorded_by: editingId ? undefined : user?.id,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const causeMap: Record<string, number> = {};
  deaths.forEach((d: any) => {
    const c = d.cause || 'Unknown';
    causeMap[c] = (causeMap[c] || 0) + 1;
  });
  const pieData = Object.entries(causeMap).map(([name, value]) => ({ name, value }));

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    {
      key: 'date', label: 'Date',
      render: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    { key: 'cause', label: 'Cause' },
    {
      key: 'recorded_by', label: 'Recorded By',
      render: (item: any) => item.recorded_by_name || item.recorded_by || '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this death record?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Death Records"
      subtitle="Record and analyze animal deaths"
      actions={<button className="btn btn-danger" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Record Death</button>}
    >
      <DataTable columns={columns} data={deaths} loading={isLoading} />

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Death Cause Analysis</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-secondary">No death data to analyze</p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Skull size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'Record'} Death</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'} ({a.species || 'Unknown'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cause *</label>
                <select className="form-select" value={form.cause} onChange={e => setForm(p => ({ ...p, cause: e.target.value }))} required>
                  <option value="">Select cause</option>
                  <option value="disease">Disease</option>
                  <option value="old_age">Old Age</option>
                  <option value="accident">Accident</option>
                  <option value="predator">Predator</option>
                  <option value="euthanasia">Euthanasia</option>
                  <option value="unknown">Unknown</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Record Death'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
