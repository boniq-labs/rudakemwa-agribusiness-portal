import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FlaskConical, CheckCircle, XCircle, Percent, Edit2, Trash2 } from 'lucide-react';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { milkAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface QualityRecord {
  id: number;
  collection_id: number;
  fat_percentage: number;
  protein: number;
  temperature: number;
  color: string;
  smell: string;
  density: number;
  contamination: boolean;
  quality_status: string;
  created_at: string;
}

interface FormData {
  collection_id: string;
  fat_percentage: string;
  protein: string;
  temperature: string;
  color: string;
  smell: string;
  density: string;
  contamination: boolean;
  quality_status: string;
}

const INITIAL_FORM: FormData = {
  collection_id: '',
  fat_percentage: '',
  protein: '',
  temperature: '',
  color: 'white',
  smell: 'normal',
  density: '',
  contamination: false,
  quality_status: 'good',
};

export default function MilkQuality() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['milk-quality'],
    queryFn: async () => {
      const res = await milkAPI.getQuality({});
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => milkAPI.createQuality(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-quality'] });
      closeModal();
      toast.success('Quality test created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => milkAPI.updateQuality(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-quality'] });
      closeModal();
      toast.success('Quality test updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => milkAPI.deleteQuality(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-quality'] });
      toast.success('Quality test deleted');
    },
    onError: () => toast.error('Failed to delete quality test'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: QualityRecord) => {
    setForm({
      collection_id: String(item.collection_id),
      fat_percentage: String(item.fat_percentage),
      protein: String(item.protein),
      temperature: String(item.temperature),
      color: item.color,
      smell: item.smell,
      density: String(item.density),
      contamination: item.contamination,
      quality_status: item.quality_status,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const records: QualityRecord[] = data || [];
  const totalTests = records.length;
  const excellent = records.filter((r) => r.quality_status === 'excellent').length;
  const rejected = records.filter((r) => r.quality_status === 'rejected').length;
  const avgFat = records.length > 0 ? (records.reduce((s, r) => s + r.fat_percentage, 0) / records.length).toFixed(2) : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      collection_id: parseInt(form.collection_id) || undefined,
      fat_percentage: parseFloat(form.fat_percentage) || 0,
      protein: parseFloat(form.protein) || 0,
      temperature: parseFloat(form.temperature) || 0,
      color: form.color,
      smell: form.smell,
      density: parseFloat(form.density) || 0,
      contamination: form.contamination,
      quality_status: form.quality_status,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<QualityRecord>[] = [
    {
      key: 'collection_id', label: 'Collection ID',
      render: (r) => `#${r.collection_id}`,
    },
    { key: 'fat_percentage', label: 'Fat %', render: (r) => `${r.fat_percentage}%` },
    { key: 'protein', label: 'Protein', render: (r) => `${r.protein}%` },
    { key: 'temperature', label: 'Temp', render: (r) => `${r.temperature}°C` },
    { key: 'color', label: 'Color' },
    { key: 'smell', label: 'Smell' },
    {
      key: 'quality_status', label: 'Status',
      render: (r) => <StatusBadge status={r.quality_status} />,
    },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this quality test?')) deleteMutation.mutate(r.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Milk Quality"
      subtitle="Quality testing results"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setShowModal(true); }}>
          <Plus size={16} /> New Test
        </button>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Tests Today" value={totalTests} icon={FlaskConical} color="#3b82f6" />
        <StatsCard title="Excellent" value={excellent} icon={CheckCircle} color="#22c55e" />
        <StatsCard title="Rejected" value={rejected} icon={XCircle} color="#ef4444" />
        <StatsCard title="Avg Fat %" value={`${avgFat}%`} icon={Percent} color="#f97316" />
      </div>

      <div style={{ marginTop: 24 }}>
        <DataTable columns={columns} data={records} loading={isLoading} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingId ? 'Edit Quality Test' : 'New Quality Test'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Collection ID</label>
                <input type="number" className="form-input" value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Fat %</label>
                  <input type="number" step="0.01" className="form-input" value={form.fat_percentage} onChange={(e) => setForm({ ...form, fat_percentage: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Protein %</label>
                  <input type="number" step="0.01" className="form-input" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Temperature (°C)</label>
                  <input type="number" step="0.1" className="form-input" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Density</label>
                  <input type="number" step="0.001" className="form-input" value={form.density} onChange={(e) => setForm({ ...form, density: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <select className="form-select" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                    <option value="white">White</option>
                    <option value="creamy">Creamy</option>
                    <option value="yellowish">Yellowish</option>
                    <option value="watery">Watery</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Smell</label>
                  <select className="form-select" value={form.smell} onChange={(e) => setForm({ ...form, smell: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="sweet">Sweet</option>
                    <option value="sour">Sour</option>
                    <option value="bitter">Bitter</option>
                    <option value="abnormal">Abnormal</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Quality Status</label>
                <select className="form-select" value={form.quality_status} onChange={(e) => setForm({ ...form, quality_status: e.target.value })}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="contamination" checked={form.contamination} onChange={(e) => setForm({ ...form, contamination: e.target.checked })} />
                <label htmlFor="contamination" style={{ margin: 0 }}>Contamination detected</label>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Test' : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
