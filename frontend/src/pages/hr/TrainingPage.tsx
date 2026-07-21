import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { trainingAPI } from '../../api/endpoints';
import { Plus, Users, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function TrainingPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', status: 'planned' });

  const { data: trainings, isLoading } = useQuery({
    queryKey: ['training'],
    queryFn: () => trainingAPI.getAll().then(r => r.data.data),
  });

  const { data: participants } = useQuery({
    queryKey: ['training', expandedId, 'participants'],
    queryFn: () => trainingAPI.getParticipants(expandedId!).then(r => r.data.data),
    enabled: expandedId !== null,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? trainingAPI.update(editing.id, data)
      : trainingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training'] });
      toast.success(editing ? 'Training updated' : 'Training created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingAPI.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training'] });
      toast.success('Training cancelled');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ title: '', description: '', start_date: '', end_date: '', status: 'planned' });
  };

  const openEdit = (training: any) => {
    setEditing(training);
    setForm({
      title: training.title || '',
      description: training.description || '',
      start_date: training.start_date || '',
      end_date: training.end_date || '',
      status: training.status || 'planned',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const columns: Column<any>[] = [
    { key: 'user_name', label: 'Participant', render: (p: any) => p.user_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || '-' },
    { key: 'status', label: 'Status', render: (p: any) => <StatusBadge status={p.status || 'enrolled'} /> },
    { key: 'enrolled_at', label: 'Enrolled At', render: (p: any) => p.enrolled_at ? new Date(p.enrolled_at).toLocaleDateString() : '-' },
  ];

  return (
    <ModulePage
      title="Training"
      subtitle="Manage training programs"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Training
        </button>
      }
    >
      {(trainings || []).length === 0 && !isLoading ? (
        <p className="text-secondary">No training programs found</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {(trainings || []).map((t: any) => (
            <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{t.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'N/A'} — {t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Users size={16} /> {t.participant_count ?? 0}
                  </span>
                  <StatusBadge status={t.status || 'planned'} />
                  <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); if (confirm('Cancel this training?')) deleteMutation.mutate(t.id); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {t.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>{t.description}</p>
              )}
              {expandedId === t.id && (
                <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Participants</h5>
                  <DataTable columns={columns} data={participants || []} loading={false} emptyMessage="No participants enrolled" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Training Program' : 'New Training Program'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Title" required>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </FormField>
              <FormField label="Description">
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </FormField>
              <div className="form-row">
                <FormField label="Start Date" required>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
                </FormField>
                <FormField label="End Date" required>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required />
                </FormField>
              </div>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FormField>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
