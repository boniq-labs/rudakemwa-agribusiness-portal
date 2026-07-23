import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { Plus, Bug, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiseaseManagement() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', disease_name: '', description: '', symptoms: '', treatment_protocol: '', is_contagious: false, severity: 'medium', date: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['diseases'],
    queryFn: async () => (await client.get('/animals/diseases')).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data.data || [],
  });

  const diseases = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/diseases', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save disease record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/diseases/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update disease record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/diseases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record deleted');
    },
    onError: () => toast.error('Failed to delete disease record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', disease_name: '', description: '', symptoms: '', treatment_protocol: '', is_contagious: false, severity: 'medium', date: new Date().toISOString().split('T')[0] });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      disease_name: item.disease_name || '',
      description: item.description || '',
      symptoms: item.symptoms || '',
      treatment_protocol: item.treatment_protocol || '',
      is_contagious: item.is_contagious ?? false,
      severity: item.severity || 'medium',
      date: item.date ? item.date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const severityMap: Record<string, string> = { low: 'mild', medium: 'moderate', high: 'severe', urgent: 'severe' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      disease_name: form.disease_name,
      description: form.description || undefined,
      symptoms: form.symptoms || undefined,
      treatment_protocol: form.treatment_protocol || undefined,
      is_contagious: form.is_contagious ? 1 : 0,
      severity: severityMap[form.severity] || 'moderate',
      date: form.date,
      status: editingId ? undefined : 'active',
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
    { key: 'disease_name', label: 'Disease' },
    { key: 'symptoms', label: 'Symptoms' },
    {
      key: 'severity', label: 'Severity',
      render: (item: any) => <StatusBadge status={item.severity || 'medium'} />,
    },
    {
      key: 'status', label: 'Status',
      render: (item: any) => <StatusBadge status={item.status || 'active'} />,
    },
    {
      key: 'date', label: 'Date',
      render: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={() => { if (confirm('Delete this disease record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Disease Management"
      subtitle="Track and manage animal diseases"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Disease Record</button>}
    >
      <DataTable columns={columns} data={diseases} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Bug size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Disease Record</h3>
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
                <label className="form-label">Disease Name *</label>
                <input className="form-input" value={form.disease_name} onChange={e => setForm(p => ({ ...p, disease_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <textarea className="form-input" rows={2} value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Treatment Protocol</label>
                <textarea className="form-input" rows={2} value={form.treatment_protocol} onChange={e => setForm(p => ({ ...p, treatment_protocol: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={form.is_contagious} onChange={e => setForm(p => ({ ...p, is_contagious: e.target.checked }))} style={{ marginRight: 8 }} />
                  Is Contagious
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select className="form-select" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
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
