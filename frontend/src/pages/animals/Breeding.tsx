import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { breedingAPI, animalAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Breeding() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    mother_id: '', father_id: '', breeding_date: '', method: 'natural', result: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['breeding'],
    queryFn: async () => (await breedingAPI.getAll()).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await animalAPI.getAll()).data.data || [],
  });

  const records = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const females = animals.filter((a: any) => a.gender === 'female');

  const createMutation = useMutation({
    mutationFn: (d: any) => breedingAPI.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      closeModal();
      toast.success('Breeding record created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => breedingAPI.update(d.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      closeModal();
      toast.success('Breeding record updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => breedingAPI.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      toast.success('Breeding record deleted');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ mother_id: '', father_id: '', breeding_date: '', method: 'natural', result: '', notes: '' });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ mother_id: '', father_id: '', breeding_date: '', method: 'natural', result: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      mother_id: String(item.mother_id),
      father_id: item.father_id ? String(item.father_id) : '',
      breeding_date: item.breeding_date ? item.breeding_date.split('T')[0] : '',
      method: item.method || 'natural',
      result: item.result || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      mother_id: Number(form.mother_id),
      father_id: form.father_id ? Number(form.father_id) : null,
      breeding_date: form.breeding_date,
      method: form.method,
      result: form.result || undefined,
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
      key: 'mother', label: 'Mother',
      render: (item: any) => item.mother_name || `#${item.mother_id}`,
    },
    {
      key: 'date', label: 'Date',
      render: (item: any) => item.breeding_date ? new Date(item.breeding_date).toLocaleDateString() : '-',
    },
    { key: 'method', label: 'Method', render: (item: any) => (item.method || '-').toUpperCase() },
    {
      key: 'result', label: 'Result',
      render: (item: any) => <StatusBadge status={item.result || item.status || 'pending'} />,
    },
    { key: 'notes', label: 'Notes', render: (item: any) => item.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this breeding record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Breeding Management"
      subtitle="Manage breeding records"
      actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Breeding Record</button>}
    >
      <DataTable columns={columns} data={records} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>{editingId ? 'Edit' : 'New'} Breeding Record</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Mother *</label>
                <select className="form-select" value={form.mother_id} onChange={e => setForm(p => ({ ...p, mother_id: e.target.value }))} required>
                  <option value="">Select mother</option>
                  {females.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Father</label>
                <select className="form-select" value={form.father_id} onChange={e => setForm(p => ({ ...p, father_id: e.target.value }))}>
                  <option value="">Select father (optional)</option>
                  {animals.filter((a: any) => a.gender === 'male').map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Breeding Date *</label>
                <input className="form-input" type="date" value={form.breeding_date} onChange={e => setForm(p => ({ ...p, breeding_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Method *</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 44 }}>
                    <input type="radio" name="method" value="natural" checked={form.method === 'natural'} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} />
                    Natural
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 44 }}>
                    <input type="radio" name="method" value="ai" checked={form.method === 'ai'} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} />
                    Artificial Insemination
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Result</label>
                <select className="form-select" value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))}>
                  <option value="">Select result</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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
