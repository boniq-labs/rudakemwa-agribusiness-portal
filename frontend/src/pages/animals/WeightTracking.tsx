import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Weight, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface WeightRecord {
  id: number;
  animal_id: number;
  date?: string;
  weight: number;
  old_weight?: number;
  difference?: number;
  notes?: string;
  animal_name?: string;
  tag_number?: string;
}

export default function WeightTracking() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', weight_date: new Date().toISOString().split('T')[0], weight: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['weights'],
    queryFn: async () => (await client.get('/animals/weights', { params: { limit: 10000 } })).data?.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data?.data || [],
  });

  const allWeights: WeightRecord[] = Array.isArray(data) ? data : [];
  const animals: any[] = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/weights', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Weight record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save weight record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/weights/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Weight record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update weight record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/weights/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weights'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Weight record deleted');
    },
    onError: () => toast.error('Failed to delete weight record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', weight_date: new Date().toISOString().split('T')[0], weight: '', notes: '' });
  };

  const openEdit = (item: WeightRecord) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      weight_date: item.date ? item.date.split('T')[0] : '',
      weight: String(item.weight),
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      weight_date: form.weight_date,
      weight: Number(form.weight),
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<WeightRecord>[] = [
    {
      key: 'date', label: 'Date',
      render: (item: WeightRecord) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    { key: 'old_weight', label: 'Old Weight', render: (item: any) => item.old_weight ? `${item.old_weight} kg` : '-' },
    { key: 'weight', label: 'New Weight', render: (item: WeightRecord) => `${item.weight} kg` },
    {
      key: 'difference', label: 'Difference',
      render: (item: any) => {
        const diff = item.difference ?? (item.old_weight ? item.weight - item.old_weight : null);
        if (diff === null) return '-';
        const sign = diff >= 0 ? '+' : '';
        return <span style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)' }}>{sign}{diff.toFixed(1)} kg</span>;
      },
    },
    { key: 'notes', label: 'Notes', render: (item: any) => item.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (item: WeightRecord) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async () => { if (await confirm('Delete this weight record?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Weight Tracking"
      subtitle="Monitor animal weight over time"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Weight Record</button>}
    >
      <DataTable columns={columns} data={allWeights} loading={isLoading} emptyMessage="No weight records" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Weight size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Weight Record</h3>
            <form onSubmit={handleSubmit}>
              <FormField label="Animal" required>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Weight Date" required>
                <input className="form-input" type="date" value={form.weight_date} onChange={e => setForm(p => ({ ...p, weight_date: e.target.value }))} required />
              </FormField>
              <FormField label="Weight (kg)" required>
                <input className="form-input" type="number" step="0.01" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} required />
              </FormField>
              <FormField label="Notes">
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
              </FormField>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
