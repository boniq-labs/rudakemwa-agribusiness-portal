import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { HeartPulse, CheckCircle, XCircle, AlertTriangle, Plus, Eye, Ban, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pregnancy() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', pregnancy_date: '', expected_delivery_date: '', sire_name: '', status: 'Pregnant', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pregnancies'],
    queryFn: async () => (await client.get('/animals/pregnancies')).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data.data || [],
  });

  const pregnancies = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const confirmed = pregnancies.filter((p: any) => p.status === 'Pregnant' || p.status === 'confirmed').length;
  const monitoring = pregnancies.filter((p: any) => p.status === 'Under Observation' || p.status === 'monitoring').length;
  const delivered = pregnancies.filter((p: any) => p.status === 'Delivered' || p.status === 'delivered').length;
  const failed = pregnancies.filter((p: any) => p.status === 'Failed' || p.status === 'Aborted' || p.status === 'failed' || p.status === 'aborted').length;

  const dueSoon = pregnancies.filter((p: any) => {
    if (!p.expected_delivery_date) return false;
    const due = new Date(p.expected_delivery_date);
    return due >= new Date() && due <= new Date(Date.now() + 7 * 86400000);
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/pregnancies', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Pregnancy record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save pregnancy record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/pregnancies/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Pregnancy record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update pregnancy record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/pregnancies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Pregnancy record deleted');
    },
    onError: () => toast.error('Failed to delete pregnancy record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', pregnancy_date: '', expected_delivery_date: '', sire_name: '', status: 'Pregnant', notes: '' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      pregnancy_date: item.pregnancy_date ? item.pregnancy_date.split('T')[0] : '',
      expected_delivery_date: item.expected_delivery_date ? item.expected_delivery_date.split('T')[0] : '',
      sire_name: item.sire_name || '',
      status: item.status || 'Pregnant',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      pregnancy_date: form.pregnancy_date,
      expected_delivery_date: form.expected_delivery_date,
      sire_name: form.sire_name || undefined,
      status: form.status,
      notes: form.notes || undefined,
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
    {
      key: 'pregnancy_date', label: 'Pregnancy Date',
      render: (item: any) => item.pregnancy_date ? new Date(item.pregnancy_date).toLocaleDateString() : '-',
    },
    {
      key: 'expected_delivery_date', label: 'Expected Delivery',
      render: (item: any) => item.expected_delivery_date ? new Date(item.expected_delivery_date).toLocaleDateString() : '-',
    },
    { key: 'sire_name', label: 'Sire', render: (item: any) => item.sire_name || '-' },
    {
      key: 'status', label: 'Status',
      render: (item: any) => <StatusBadge status={item.status || 'pending'} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={() => { if (confirm('Delete this pregnancy record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Pregnancy Tracking"
      subtitle="Monitor pregnancies"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Pregnancy</button>}
    >
      {dueSoon.length > 0 && (
        <div className="alert" style={{ background: '#fef9c3', border: '1px solid #fde68a', color: '#854d0e', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={20} />
          <span><strong>{dueSoon.length}</strong> pregnancy(ies) due within 7 days</span>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <StatsCard title="Pregnant" value={confirmed} icon={HeartPulse} color="#16a34a" />
        <StatsCard title="Under Observation" value={monitoring} icon={Eye} color="#2563eb" />
        <StatsCard title="Delivered" value={delivered} icon={CheckCircle} color="#d97706" />
        <StatsCard title="Failed" value={failed} icon={XCircle} color="#dc2626" />
        <StatsCard title="Aborted" value={pregnancies.filter((p: any) => p.status === 'Aborted').length} icon={Ban} color="#7c3aed" />
      </div>

      <DataTable columns={columns} data={pregnancies} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>{editingId ? 'Edit' : 'New'} Pregnancy</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.filter((a: any) => a.gender === 'female').map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pregnancy Date *</label>
                <input className="form-input" type="date" value={form.pregnancy_date} onChange={e => setForm(p => ({ ...p, pregnancy_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Delivery Date *</label>
                <input className="form-input" type="date" value={form.expected_delivery_date} onChange={e => setForm(p => ({ ...p, expected_delivery_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sire Name</label>
                <input className="form-input" value={form.sire_name} onChange={e => setForm(p => ({ ...p, sire_name: e.target.value }))} placeholder="Name or ID of sire" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                  <option value="Aborted">Aborted</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
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
