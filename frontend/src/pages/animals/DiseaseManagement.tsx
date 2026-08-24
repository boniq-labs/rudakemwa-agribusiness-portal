import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Bug, Skull, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAnimalSelect, animalSelectStateOptions } from '../../hooks/useAnimalSelect';

const PIE_COLORS = ['#dc2626', '#d97706', '#2563eb', '#16a34a', '#8b5cf6', '#ec4899'];

type Tab = 'diseases' | 'deaths';

/**
 * Combined Health & Mortality module:
 *  - Tab 1 "Diseases"      — full disease CRUD (unchanged endpoints /animals/diseases)
 *  - Tab 2 "Death Records" — full death CRUD + cause analysis (unchanged /animals/deaths)
 */
export default function DiseaseManagement() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('diseases');

  /* ================= DISEASES state/logic (preserved) ================= */
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [editingDiseaseId, setEditingDiseaseId] = useState<number | null>(null);
  const [diseaseForm, setDiseaseForm] = useState({
    animal_id: '', disease_name: '', description: '', symptoms: '', treatment_protocol: '', is_contagious: false, severity: 'medium', date: new Date().toISOString().split('T')[0],
  });

  const { data: diseaseData, isLoading: diseaseLoading } = useQuery({
    queryKey: ['diseases'],
    queryFn: async () => (await client.get('/animals/diseases', { params: { limit: 10000 } })).data.data || [],
  });
  const diseases = Array.isArray(diseaseData) ? diseaseData : [];

  const createDiseaseMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/diseases', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record created');
      setShowDiseaseModal(false);
      resetDiseaseForm();
    },
    onError: () => toast.error('Failed to save disease record'),
  });

  const updateDiseaseMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/diseases/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record updated');
      setShowDiseaseModal(false);
      setEditingDiseaseId(null);
      resetDiseaseForm();
    },
    onError: () => toast.error('Failed to update disease record'),
  });

  const deleteDiseaseMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/diseases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Disease record deleted');
    },
    onError: () => toast.error('Failed to delete disease record'),
  });

  const resetDiseaseForm = () => {
    setDiseaseForm({ animal_id: '', disease_name: '', description: '', symptoms: '', treatment_protocol: '', is_contagious: false, severity: 'medium', date: new Date().toISOString().split('T')[0] });
  };

  const openDiseaseEdit = (item: any) => {
    setEditingDiseaseId(item.id);
    setDiseaseForm({
      animal_id: String(item.animal_id),
      disease_name: item.disease_name || '',
      description: item.description || '',
      symptoms: item.symptoms || '',
      treatment_protocol: item.treatment_protocol || '',
      is_contagious: item.is_contagious ?? false,
      severity: item.severity || 'medium',
      date: item.date ? String(item.date).split('T')[0] : '',
    });
    setShowDiseaseModal(true);
  };

  const severityMap: Record<string, string> = { low: 'mild', medium: 'moderate', high: 'severe', urgent: 'severe' };

  const handleDiseaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(diseaseForm.animal_id),
      disease_name: diseaseForm.disease_name,
      description: diseaseForm.description || undefined,
      symptoms: diseaseForm.symptoms || undefined,
      treatment_protocol: diseaseForm.treatment_protocol || undefined,
      is_contagious: diseaseForm.is_contagious ? 1 : 0,
      severity: severityMap[diseaseForm.severity] || 'moderate',
      date: diseaseForm.date,
      status: editingDiseaseId ? undefined : 'active',
    };
    if (editingDiseaseId) updateDiseaseMutation.mutate({ id: editingDiseaseId, ...payload });
    else createDiseaseMutation.mutate(payload);
  };

  /* ================= DEATHS state/logic (preserved) ================= */
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [editingDeathId, setEditingDeathId] = useState<number | null>(null);
  const [deathForm, setDeathForm] = useState({
    animal_id: '', date: new Date().toISOString().split('T')[0], cause: '', notes: '',
  });

  const { data: deathData, isLoading: deathLoading } = useQuery({
    queryKey: ['deaths'],
    queryFn: async () => (await client.get('/animals/deaths', { params: { limit: 10000 } })).data.data || [],
  });
  const deaths = Array.isArray(deathData) ? deathData : [];

  const createDeathMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/deaths', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record created');
      setShowDeathModal(false);
      resetDeathForm();
    },
    onError: () => toast.error('Failed to save death record'),
  });

  const updateDeathMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/deaths/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record updated');
      setShowDeathModal(false);
      setEditingDeathId(null);
      resetDeathForm();
    },
    onError: () => toast.error('Failed to update death record'),
  });

  const deleteDeathMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/deaths/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deaths'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Death record deleted');
    },
    onError: () => toast.error('Failed to delete death record'),
  });

  const resetDeathForm = () => {
    setDeathForm({ animal_id: '', date: new Date().toISOString().split('T')[0], cause: '', notes: '' });
  };

  const openDeathEdit = (item: any) => {
    setEditingDeathId(item.id);
    setDeathForm({
      animal_id: String(item.animal_id),
      date: item.date ? String(item.date).split('T')[0] : '',
      cause: item.cause || '',
      notes: item.notes || '',
    });
    setShowDeathModal(true);
  };

  const handleDeathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(deathForm.animal_id),
      date: deathForm.date,
      cause: deathForm.cause,
      notes: deathForm.notes || undefined,
    };
    if (editingDeathId) updateDeathMutation.mutate({ id: editingDeathId, ...payload });
    else createDeathMutation.mutate(payload);
  };

  const causeMap: Record<string, number> = {};
  deaths.forEach((d: any) => {
    const c = d.cause || 'Unknown';
    causeMap[c] = (causeMap[c] || 0) + 1;
  });
  const pieData = Object.entries(causeMap).map(([name, value]) => ({ name, value }));

  /* ================= Animals select — ALL eligible, no limits ================= */
  const animalSelect = useAnimalSelect();
  const animalsData = animalSelect.animals;
  const animals = Array.isArray(animalsData) ? animalsData : [];

  /* ================= Columns ================= */
  const diseaseColumns: Column<any>[] = [
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
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openDiseaseEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this disease record?')) deleteDiseaseMutation.mutate(item.id); }} disabled={deleteDiseaseMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const deathColumns: Column<any>[] = [
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
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openDeathEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this death record?')) deleteDeathMutation.mutate(item.id); }} disabled={deleteDeathMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Health & Mortality"
      subtitle="Disease management and death records in one place"
      actions={
        tab === 'diseases'
          ? <button className="btn btn-primary" onClick={() => { setEditingDiseaseId(null); resetDiseaseForm(); setShowDiseaseModal(true); }}><Plus size={16} /> New Disease Record</button>
          : <button className="btn btn-danger" onClick={() => { setEditingDeathId(null); resetDeathForm(); setShowDeathModal(true); }}><Plus size={16} /> Record Death</button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn btn-sm ${tab === 'diseases' ? 'btn-primary' : ''}`} onClick={() => setTab('diseases')}><Bug size={14} /> Diseases ({diseases.length})</button>
        <button className={`btn btn-sm ${tab === 'deaths' ? 'btn-danger' : ''}`} onClick={() => setTab('deaths')}><Skull size={14} /> Death Records ({deaths.length})</button>
      </div>

      {tab === 'diseases'
        ? <DataTable columns={diseaseColumns} data={diseases} loading={diseaseLoading} />
        : (
          <>
            <DataTable columns={deathColumns} data={deaths} loading={deathLoading} />
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
          </>
        )}

      {/* ---- Disease modal ---- */}
      {showDiseaseModal && (
        <div className="modal-overlay" onClick={() => setShowDiseaseModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Bug size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingDiseaseId ? 'Edit' : 'New'} Disease Record</h3>
            <form onSubmit={handleDiseaseSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={diseaseForm.animal_id} onChange={e => setDiseaseForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label} value={o.value} disabled>{o.label}</option>)}
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Disease Name *</label>
                <input className="form-input" value={diseaseForm.disease_name} onChange={e => setDiseaseForm(p => ({ ...p, disease_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={diseaseForm.description} onChange={e => setDiseaseForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <textarea className="form-input" rows={2} value={diseaseForm.symptoms} onChange={e => setDiseaseForm(p => ({ ...p, symptoms: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Treatment Protocol</label>
                <textarea className="form-input" rows={2} value={diseaseForm.treatment_protocol} onChange={e => setDiseaseForm(p => ({ ...p, treatment_protocol: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <input type="checkbox" checked={diseaseForm.is_contagious} onChange={e => setDiseaseForm(p => ({ ...p, is_contagious: e.target.checked }))} style={{ marginRight: 8 }} />
                  Is Contagious
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select className="form-select" value={diseaseForm.severity} onChange={e => setDiseaseForm(p => ({ ...p, severity: e.target.value }))} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={diseaseForm.date} onChange={e => setDiseaseForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowDiseaseModal(false); setEditingDiseaseId(null); resetDiseaseForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createDiseaseMutation.isPending || updateDiseaseMutation.isPending}>
                  {createDiseaseMutation.isPending || updateDiseaseMutation.isPending ? 'Saving...' : editingDiseaseId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Death modal ---- */}
      {showDeathModal && (
        <div className="modal-overlay" onClick={() => setShowDeathModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Skull size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingDeathId ? 'Edit' : 'Record'} Death</h3>
            <form onSubmit={handleDeathSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={deathForm.animal_id} onChange={e => setDeathForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label} value={o.value} disabled>{o.label}</option>)}
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={deathForm.date} onChange={e => setDeathForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cause *</label>
                <select className="form-select" value={deathForm.cause} onChange={e => setDeathForm(p => ({ ...p, cause: e.target.value }))} required>
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
                <textarea className="form-input" rows={3} value={deathForm.notes} onChange={e => setDeathForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowDeathModal(false); setEditingDeathId(null); resetDeathForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={createDeathMutation.isPending || updateDeathMutation.isPending}>
                  {createDeathMutation.isPending || updateDeathMutation.isPending ? 'Saving...' : editingDeathId ? 'Update' : 'Record Death'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
