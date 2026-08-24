import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import FormField from '../../components/FormField';
import { performanceAPI, usersAPI } from '../../api/endpoints';
import { Plus, Edit2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function PerformancePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ user_id: '', reviewer_name: '', score: '', review_date: new Date().toISOString().split('T')[0], notes: '' });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => performanceAPI.getAll().then(r => r.data.data),
  });

  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? performanceAPI.update(editing.id, data)
      : performanceAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      toast.success(editing ? 'Review updated' : 'Review created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ user_id: '', reviewer_name: '', score: '', review_date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const openEdit = (review: any) => {
    setEditing(review);
    setForm({
      user_id: review.user_id?.toString() || '',
      reviewer_name: review.reviewer_name || '',
      score: review.score?.toString() || '',
      review_date: review.review_date ? new Date(review.review_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: review.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      user_id: Number(form.user_id),
      reviewer_name: form.reviewer_name,
      score: Number(form.score),
      review_date: form.review_date,
      notes: form.notes,
    });
  };

  const getRating = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const columns: Column<any>[] = [
    { key: 'user_name', label: 'Employee', render: (r: any) => r.employee_name || r.user_name || (r.user ? `${r.user.first_name} ${r.user.last_name}` : '') || '-' },
    { key: 'reviewer_name', label: 'Reviewer', render: (r: any) => r.reviewer_name || '-' },
    {
      key: 'score', label: 'Score',
      render: (r: any) => r.score != null ? `${r.score}%` : '-',
    },
    {
      key: 'rating', label: 'Rating',
      render: (r: any) => r.rating || (r.score != null ? getRating(r.score) : '-'),
    },
    { key: 'review_date', label: 'Date', render: (r: any) => r.review_date ? new Date(r.review_date).toLocaleDateString() : '-' },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(r)}>
            <Edit2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Performance Reviews"
      subtitle="Manage employee performance evaluations"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Review
        </button>
      }
    >
      <DataTable columns={columns} data={reviews || []} loading={isLoading} emptyMessage="No performance reviews found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Performance Review' : 'New Performance Review'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Employee" required>
                <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))} required>
                  <option value="">Select employee</option>
                  {(employees || []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Reviewer Name" required>
                <input value={form.reviewer_name} onChange={e => setForm(p => ({ ...p, reviewer_name: e.target.value }))} required />
              </FormField>
              <div className="form-row">
                <FormField label="Score (%)" required>
                  <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} required />
                </FormField>
                <FormField label="Review Date" required>
                  <input type="date" value={form.review_date} onChange={e => setForm(p => ({ ...p, review_date: e.target.value }))} required />
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
              </FormField>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
