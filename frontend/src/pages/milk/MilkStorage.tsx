import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Thermometer } from 'lucide-react';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { milkAPI } from '../../api/endpoints';

interface Tank {
  id: number;
  name: string;
  capacity: number;
  current_level: number;
  status: string;
  temperature?: number;
}

interface StorageRecord {
  id: number;
  tank_name: string;
  collection_id: number;
  quantity_liters: number;
  production_date: string;
  expiry_date: string;
  status: string;
}

interface FormData {
  tank_id: string;
  collection_id: string;
  quantity_liters: string;
  production_date: string;
  expiry_date: string;
}

const INITIAL_FORM: FormData = {
  tank_id: '',
  collection_id: '',
  quantity_liters: '',
  production_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
};

export default function MilkStorage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const queryClient = useQueryClient();

  const { data: tanksData } = useQuery({
    queryKey: ['milk-tanks'],
    queryFn: async () => {
      const res = await milkAPI.getTanks();
      return res.data.data || [];
    },
  });

  const { data: storageData, isLoading } = useQuery({
    queryKey: ['milk-storage'],
    queryFn: async () => {
      const res = await milkAPI.getStorage({});
      return res.data.data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => milkAPI.addToStorage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-storage'] });
      queryClient.invalidateQueries({ queryKey: ['milk-tanks'] });
      setShowModal(false);
      setForm(INITIAL_FORM);
    },
  });

  const tanks: Tank[] = tanksData || [];
  const storage: StorageRecord[] = storageData || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      tank_id: parseInt(form.tank_id),
      collection_id: parseInt(form.collection_id) || undefined,
      quantity_liters: parseFloat(form.quantity_liters) || 0,
      production_date: form.production_date,
      expiry_date: form.expiry_date || undefined,
    });
  };

  const columns: Column<StorageRecord>[] = [
    { key: 'tank_name', label: 'Tank' },
    { key: 'collection_id', label: 'Collection', render: (r) => `#${r.collection_id}` },
    { key: 'quantity_liters', label: 'Quantity', render: (r) => `${r.quantity_liters} L` },
    { key: 'production_date', label: 'Production Date' },
    { key: 'expiry_date', label: 'Expiry' },
    { key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <ModulePage
      title="Storage Management"
      subtitle="Manage milk storage tanks"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add to Storage
        </button>
      }
    >
      <div className="stats-grid">
        {tanks.map((tank) => {
          const pct = tank.capacity > 0 ? Math.round((tank.current_level / tank.capacity) * 100) : 0;
          const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#eab308' : '#22c55e';
          return (
            <div key={tank.id} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="stat-icon" style={{ background: `${barColor}20`, color: barColor }}>
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{tank.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tank.temperature ? `${tank.temperature}°C` : ''}</div>
                  </div>
                </div>
                <StatusBadge status={tank.status} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{tank.current_level} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/ {tank.capacity} L</span></div>
              <div style={{ width: '100%', height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 5, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pct}% full</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Stored Milk</h3>
        <DataTable columns={columns} data={storage} loading={isLoading} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>Add to Storage</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tank</label>
                <select className="form-select" value={form.tank_id} onChange={(e) => setForm({ ...form, tank_id: e.target.value })} required>
                  <option value="">Select Tank</option>
                  {tanks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.current_level}/{t.capacity}L)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Collection ID</label>
                <input type="number" className="form-input" value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (Liters)</label>
                <input type="number" step="0.01" className="form-input" value={form.quantity_liters} onChange={(e) => setForm({ ...form, quantity_liters: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Production Date</label>
                <input type="date" className="form-input" value={form.production_date} onChange={(e) => setForm({ ...form, production_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding...' : 'Add to Storage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
