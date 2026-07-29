import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementAPI, animalAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Plus, ArrowRightLeft, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnimalTransfers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', from_location: '', to_location: '', date: new Date().toISOString().split('T')[0], reason: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => (await movementAPI.getTransfers()).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await animalAPI.getAll()).data.data || [],
  });

  const transfers = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => movementAPI.createTransfer(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Transfer created');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => movementAPI.updateTransfer(d.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Transfer updated');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => movementAPI.deleteTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Transfer deleted');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ animal_id: '', from_location: '', to_location: '', date: new Date().toISOString().split('T')[0], reason: '' });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ animal_id: '', from_location: '', to_location: '', date: new Date().toISOString().split('T')[0], reason: '' });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      from_location: item.from_location || '',
      to_location: item.to_location || '',
      date: item.date ? item.date.split('T')[0] : '',
      reason: item.reason || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, animal_id: Number(form.animal_id) };
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
    { key: 'from_location', label: 'From' },
    { key: 'to_location', label: 'To' },
    {
      key: 'date', label: 'Date',
      render: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    { key: 'reason', label: 'Reason', render: (item: any) => item.reason || '-' },
    {
      key: 'approved_by', label: 'Approved By',
      render: (item: any) => item.approved_by_name || item.approved_by || '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={() => { if (confirm('Delete this transfer record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Animal Transfers"
      subtitle="Record and manage animal transfers between locations"
      actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Transfer</button>}
    >
      <DataTable columns={columns} data={transfers} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><ArrowRightLeft size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Transfer</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">From Location *</label>
                <input className="form-input" value={form.from_location} onChange={e => setForm(p => ({ ...p, from_location: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">To Location *</label>
                <input className="form-input" value={form.to_location} onChange={e => setForm(p => ({ ...p, to_location: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
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
