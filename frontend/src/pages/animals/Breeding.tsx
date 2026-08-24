import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import type { Column } from '../../components/DataTable';
import { Plus, Edit2, Trash2, HeartPulse, Eye, RefreshCw, CalendarClock, Baby, Flame, Repeat } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAnimalSelect, animalSelectStateOptions } from '../../hooks/useAnimalSelect';

/* Workflow: Planned → Inseminated → Pregnancy Check (vet) → Pregnant / Returned Heat / Rebred → Delivered */
const PIG_CHECK_MIN_DAY = 18; // pig heat-check window opens on day 18 (mirrors backend PIG_HEAT_CYCLE_MIN_DAYS)

type Tab = 'history' | 'monitoring';

const statusBadge = (s?: string | null) => {
  const v = (s || '').toLowerCase();
  if (['pregnant', 'confirmed'].includes(v)) return 'badge-success';
  if (v === 'under observation' || v === 'monitoring') return 'badge-info';
  if (v === 'returned heat' || v === 'returned_heat') return 'badge-warning';
  if (v === 'rebred' || v === 'rebreed') return 'badge-info';
  if (v === 'delivered') return 'badge-success';
  if (v === 'inseminated') return 'badge-info';
  if (v === 'failed' || v === 'aborted' || v === 'rejected') return 'badge-danger';
  return 'badge-secondary';
};

export default function Breeding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('monitoring');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [checkPreg, setCheckPreg] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<'pregnant' | 'returned_heat' | 'rebred'>('pregnant');
  /* LOCAL TESTING ONLY: simulate "today" to test the 18–24 day pig window /
     283-day cattle gestation without waiting. Empty = real dates. */
  const [simDate, setSimDate] = useState('');

  // Pregnancy Check is restricted to: Admin, Farm Owner, Animal Production
  // Manager, Veterinary Manager — OR any user assigned to the Animal Production
  // department (backend already authorises department roles identically).
  const role = (user?.role || '').toLowerCase();
  const inAnimalDept = (user as any)?.departments?.some((d: any) =>
    /animal production/i.test(d?.name || '') || d?.slug === 'animal');
  const isVetChecker = ['admin', 'farm_owner', 'animal', 'veterinarian'].includes(role) || !!inAnimalDept;

  const [form, setForm] = useState({
    mother_id: '', father_id: '', breeding_date: new Date().toISOString().split('T')[0],
    method: 'natural', insemination_date: '', technician: '', notes: '',
  });

  /* ALL eligible animals — no limits, deleted/dead/sold excluded server-side */
  const animalSelect = useAnimalSelect();
  const animalsData = animalSelect.animals;

  const { data: breedingData, isLoading: breedingLoading } = useQuery({
    queryKey: ['breeding'],
    queryFn: async () => (await client.get('/animals/breeding', { params: { limit: 10000 } })).data?.data || [],
  });

  const { data: pregnanciesData, isLoading: pregLoading } = useQuery({
    queryKey: ['pregnancies', { as_of: simDate }],
    queryFn: async () => (await client.get('/animals/pregnancies', { params: { limit: 10000, ...(simDate ? { as_of: simDate } : {}) } })).data?.data || [],
  });

  const records: any[] = Array.isArray(breedingData) ? breedingData : [];
  const animals: any[] = Array.isArray(animalsData) ? animalsData : [];
  const pregnancies: any[] = Array.isArray(pregnanciesData) ? pregnanciesData : [];

  const females = animals.filter((a: any) => (a.gender || '').toLowerCase() === 'female');
  const males = animals.filter((a: any) => (a.gender || '').toLowerCase() === 'male');

  /* ---- Automatic stats ---- */
  const pregnantCount = pregnancies.filter((p: any) => ['pregnant', 'confirmed'].includes((p.status || '').toLowerCase())).length;
  const observingCount = pregnancies.filter((p: any) => ['under observation', 'monitoring'].includes((p.status || '').toLowerCase())).length;
  const returnedHeatCount = pregnancies.filter((p: any) => ['returned heat', 'returned_heat'].includes((p.status || '').toLowerCase())).length;

  /* Only the NEWEST cycle per animal is its current reproduction cycle;
     older cycles remain in Breeding History — no duplicate active rows (§7). */
  const currentCycles: any[] = [];
  const seenAnimal = new Set<number>();
  for (const p of [...pregnancies].sort((a, b) => b.id - a.id)) {
    if (!seenAnimal.has(p.animal_id)) { seenAnimal.add(p.animal_id); currentCycles.push(p); }
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['breeding'] });
    queryClient.invalidateQueries({ queryKey: ['pregnancies'] });
    queryClient.invalidateQueries({ queryKey: ['animals'] });
    queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['birth-records'] });
  };

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/breeding', d),
    onSuccess: (res: any) => {
      invalidateAll();
      closeModal();
      const d = res?.data?.data;
      toast.success(`Breeding recorded — pregnancy monitoring started automatically${d?.expected_delivery_date ? ` · Expected delivery ${d.expected_delivery_date}` : ''}`, { duration: 5000 });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save breeding record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/breeding/${d.id}`, d),
    onSuccess: () => { invalidateAll(); closeModal(); toast.success('Breeding record updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update breeding record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/breeding/${id}`),
    onSuccess: () => { invalidateAll(); toast.success('Breeding record deleted'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete breeding record'),
  });

  /* Pregnancy Check — Veterinary-only confirmation */
  const checkMutation = useMutation({
    mutationFn: ({ id, result }: { id: number; result: string }) =>
      client.put(`/animals/pregnancies/${id}/status`, { status: result }),
    onSuccess: (res: any) => {
      invalidateAll();
      setCheckPreg(null);
      const d = res?.data?.data || {};
      toast.success(`${d.status} confirmed${d.expected_delivery_date ? ` · Delivery ${d.expected_delivery_date}` : ''}${d.ready_to_rebreed ? ' · Animal ready for rebreeding' : ''}`, { duration: 5000 });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to confirm pregnancy check'),
  });

  const resetForm = () => setForm({
    mother_id: '', father_id: '', breeding_date: new Date().toISOString().split('T')[0],
    method: 'natural', insemination_date: '', technician: '', notes: '',
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); resetForm(); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      mother_id: String(item.mother_id ?? ''),
      father_id: item.father_id ? String(item.father_id) : '',
      breeding_date: item.breeding_date ? String(item.breeding_date).split('T')[0] : '',
      method: item.method === 'artificial' || item.method === 'ai' ? 'ai' : 'natural',
      insemination_date: item.insemination_date ? String(item.insemination_date).split('T')[0] : '',
      technician: item.technician || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      mother_id: Number(form.mother_id),
      father_id: form.father_id ? Number(form.father_id) : undefined,
      breeding_date: form.breeding_date,
      method: form.method,
      insemination_date: form.method === 'ai' && form.insemination_date ? form.insemination_date : undefined,
      technician: form.technician.trim() || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  /* ---------- Breeding History columns ---------- */
  const historyColumns: Column<any>[] = [
    { key: 'mother', label: 'Mother', render: (i: any) => `${i.mother_name || 'Unnamed'} (${i.mother_tag || '-'})` },
    { key: 'species', label: 'Species', render: (i: any) => <span className="badge badge-secondary">{i.species_label}</span> },
    { key: 'date', label: 'Breeding Date', render: (i: any) => i.breeding_date ? new Date(i.breeding_date).toLocaleDateString() : '-' },
    { key: 'method', label: 'Method', render: (i: any) => (
      <span className="badge" style={i.method === 'artificial' || i.method === 'ai' ? { background: '#dbeafe', color: '#1d4ed8' } : { background: '#dcfce7', color: '#15803d' }}>
        {i.method === 'artificial' || i.method === 'ai' ? 'AI' : 'Natural'}
      </span>
    ) },
    { key: 'technician', label: 'Technician', render: (i: any) => i.technician || '-' },
    { key: 'result', label: 'Status', render: (i: any) => {
        const raw = (i.result || 'pending').toLowerCase();
        // Workflow naming: pending == Planned
        const label = raw === 'pending' ? 'Planned' : raw.replace(/_/g, ' ');
        return <span className={`badge ${statusBadge(raw)}`}>{label}</span>;
      } },
    { key: 'expected', label: 'Expected Delivery', render: (i: any) => i.expected_delivery_auto ? new Date(i.expected_delivery_auto).toLocaleDateString() : '-' },
    {
      key: 'actions', label: 'Actions',
      render: (i: any) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(i)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this breeding record?')) deleteMutation.mutate(i.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  /* ---------- Pregnancy Monitoring columns (all automatic) ---------- */
  const monitorColumns: Column<any>[] = [
    { key: 'animal', label: 'Animal', render: (p: any) => `${p.animal_name || 'Unnamed'} (${p.tag_number || '-'})` },
    { key: 'species', label: 'Species', render: (p: any) => <span className="badge badge-secondary">{p.species_label}</span> },
    { key: 'insemination', label: 'Inseminated', render: (p: any) => {
        const d = p.pregnancy_date || p.breeding_date;
        return d ? new Date(d).toLocaleDateString() : '-';
      } },
    { key: 'day', label: 'Day', render: (p: any) => p.days_since_insemination != null ? `Day ${p.days_since_insemination}` : '-' },
    { key: 'heatwin', label: 'Heat Window', render: (p: any) => p.species_label === 'Pig'
        ? (p.heat_window_start ? `${new Date(p.heat_window_start).toLocaleDateString()} → ${new Date(p.heat_window_end).toLocaleDateString()}` : '-')
        : <span className="text-secondary">N/A</span> },
    { key: 'delivery', label: 'Expected Delivery', render: (p: any) => (
      <div>
        <div>{p.expected_delivery_auto ? new Date(p.expected_delivery_auto).toLocaleDateString() : '-'}</div>
        {p.delivery_countdown && (
          <div style={{ fontSize: '0.75rem', marginTop: 2, fontWeight: 600,
            color: p.days_until_delivery != null && p.days_until_delivery < 0 ? '#dc2626'
              : p.days_until_delivery === 0 ? '#d97706' : '#16a34a' }}>
            {p.delivery_countdown}
          </div>
        )}
      </div>
    ) },
    { key: 'status', label: 'Status', render: (p: any) => (
      <span className={`badge ${statusBadge(p.status)}${p.due_soon ? ' pulse-warning' : ''}`}>{p.status}</span>
    ) },
    { key: 'next', label: 'Next Action', render: (p: any) => (
      <span style={{ fontSize: '0.8rem' }}>{p.next_action}{p.ready_to_rebreed ? ' 🔄' : ''}</span>
    ) },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => {
        const st = (p.status || '').toLowerCase();
        const decided = ['pregnant', 'confirmed', 'returned heat', 'returned_heat', 'rebred', 'rebreed', 'delivered'].includes(st);
        // Pregnancy-check visibility:
        //  - Only Pig/Cattle enter the check workflow (§8 species guard).
        //  - Pigs: hidden before day 18; visible from day 18 onward.
        const isPig = p.species_label === 'Pig';
        const isCattle = p.species_label === 'Cattle';
        const day = p.days_since_insemination;
        const supportedSpecies = isPig || isCattle;
        const checkable = !decided && supportedSpecies && (!isPig || (day != null && day >= PIG_CHECK_MIN_DAY));
        // Professional action-button styling (inline so the global `*{padding:0}`
        // reset cannot flatten it). Same shape for enabled + disabled variants.
        const checkBtnStyle: React.CSSProperties = {
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          fontSize: '0.8rem', fontWeight: 500, lineHeight: 1,
          border: 'none', whiteSpace: 'nowrap',
        };
        const startNewCycle = async () => {
          if (!(await confirm(`Start a NEW breeding cycle for ${p.animal_name} from ${simDate || 'today'}? The previous attempt stays in Breeding History.`))) return;
          try {
            await client.post('/animals/breeding', {
              mother_id: p.animal_id,
              breeding_date: simDate || new Date().toISOString().split('T')[0],
              method: p.breeding_method === 'natural' ? 'natural' : 'ai',
              insemination_date: simDate || new Date().toISOString().split('T')[0],
              technician: p.technician || undefined,
              notes: 'New cycle after returned heat',
            });
            invalidateAll();
            toast.success('New cycle started — Day 0, heat window and dates calculated from the new insemination date');
          } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to start new cycle'); }
        };
        return (
          <div className="actions">
            {checkable && isVetChecker && (
              <button
                className="btn btn-sm btn-primary"
                style={{ ...checkBtnStyle, background: 'var(--primary, #16a34a)', color: '#fff', cursor: 'pointer' }}
                title="Pregnancy Check"
                onClick={(e) => { e.stopPropagation(); setCheckResult('pregnant'); setCheckPreg(p); }}
              >
                <HeartPulse size={14} /> Pregnancy Check
              </button>
            )}
            {checkable && !isVetChecker && (
              <button
                className="btn btn-sm"
                disabled
                style={{ ...checkBtnStyle, background: 'var(--border, #e5e7eb)', color: 'var(--text-secondary, #6b7280)', cursor: 'not-allowed' }}
                title="Only Admin, Animal Production Manager or Veterinary Manager can confirm"
              >
                <HeartPulse size={14} /> Pregnancy Check
              </button>
            )}
            {decided && !isVetChecker && <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Vet only</span>}
            {/* View Details — every row */}
            <button className="btn btn-sm" title="View animal details" onClick={(e) => { e.stopPropagation(); navigate(`/animals/profile/${p.animal_id}`); }}>
              <Eye size={14} /> View
            </button>
            {/* PREGNANT → monitoring + history shortcuts */}
            {['pregnant', 'confirmed'].includes(st) && (
              <>
                <button className="btn btn-sm" title="Pregnancy Monitoring" onClick={(e) => { e.stopPropagation(); setTab('monitoring'); }}>
                  <HeartPulse size={14} /> Monitoring
                </button>
                <button className="btn btn-sm" title="Breeding History" onClick={(e) => { e.stopPropagation(); setTab('history'); }}>
                  <Repeat size={14} /> History
                </button>
              </>
            )}
            {/* RETURNED HEAT → previous attempt failed; start new cycle from actual date */}
            {p.ready_to_rebreed && isVetChecker && (
              <button className="btn btn-sm" style={{ ...checkBtnStyle, background: '#d97706', color: '#fff', cursor: 'pointer' }}
                title={`Previous attempt failed — start new cycle (Day 0 = ${simDate || 'today'})`}
                onClick={async (e) => { e.stopPropagation(); await startNewCycle(); }}>
                <Repeat size={14} /> Start New Cycle
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ModulePage
      title="Breeding & Reproduction"
      subtitle="Planned breeding, insemination, pregnancy check, monitoring and delivery"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Breeding</button>}
    >
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <StatsCard title="Under Observation" value={observingCount} icon={Eye} color="#2563eb" />
        <StatsCard title="Pregnant" value={pregnantCount} icon={HeartPulse} color="#16a34a" />
        <StatsCard title="Returned Heat" value={returnedHeatCount} icon={Flame} color="#d97706" />
        <StatsCard title="Birth Records" value={records.filter((r: any) => r.result === 'delivered').length} icon={Baby} color="#8b5cf6" />
      </div>

      {/* LOCAL TESTING ONLY — date simulator (no biological rules changed) */}
      <div className="card" style={{ padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', border: simDate ? '1px solid #f59e0b' : undefined }}>
        <CalendarClock size={16} style={{ color: '#d97706' }} />
        <span style={{ fontSize: '0.82rem' }}><strong>Local testing:</strong> simulate today's date to instantly test heat windows & delivery countdowns</span>
        <input type="date" className="form-input" style={{ maxWidth: 170, padding: '4px 8px' }} value={simDate} onChange={e => setSimDate(e.target.value)} />
        {simDate && (
          <>
            <span className="badge badge-warning">Simulating {simDate}</span>
            <button className="btn btn-sm" onClick={() => setSimDate('')}>Reset to real dates</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`btn btn-sm ${tab === 'monitoring' ? 'btn-primary' : ''}`} onClick={() => setTab('monitoring')}><Eye size={14} /> Pregnancy Monitoring</button>
        <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : ''}`} onClick={() => setTab('history')}><RefreshCw size={14} /> Breeding History</button>
      </div>

      {tab === 'monitoring'
        ? <DataTable columns={monitorColumns} data={currentCycles} loading={pregLoading} emptyMessage="No pregnancies monitored yet — record a breeding to start automatic monitoring" />
        : <DataTable columns={historyColumns} data={records} loading={breedingLoading} emptyMessage="No breeding records yet" />}

      {/* ---- New/Edit Breeding (Insemination) modal ---- */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 6, fontSize: '1.1rem', fontWeight: 600 }}>{editingId ? 'Edit' : 'New'} Breeding Record</h3>
            {!editingId && <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: 16 }}>Saving automatically starts pregnancy monitoring with species-specific dates (Pig ≠ Cattle).</p>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Mother *</label>
                <select className="form-select" value={form.mother_id} onChange={e => setForm(p => ({ ...p, mother_id: e.target.value }))} required>
                  <option value="">Select mother</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label+'m'} value={o.value} disabled>{o.label}</option>)}
                  {females.map((a: any) => <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Father (optional)</label>
                <select className="form-select" value={form.father_id} onChange={e => setForm(p => ({ ...p, father_id: e.target.value }))}>
                  <option value="">Select father (optional)</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label+'f'} value={o.value} disabled>{o.label}</option>)}
                  {males.map((a: any) => <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>)}
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
                    <input type="radio" name="method" value="natural" checked={form.method === 'natural'} onChange={() => setForm(p => ({ ...p, method: 'natural' }))} /> Natural
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minHeight: 44 }}>
                    <input type="radio" name="method" value="ai" checked={form.method === 'ai'} onChange={() => setForm(p => ({ ...p, method: 'ai' }))} /> Artificial Insemination
                  </label>
                </div>
              </div>

              {form.method === 'ai' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Insemination Date</label>
                    <input className="form-input" type="date" value={form.insemination_date} onChange={e => setForm(p => ({ ...p, insemination_date: e.target.value }))} />
                    <small className="text-secondary">Defaults to the breeding date when left empty.</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Technician</label>
                    {/* TEXT INPUT — intentionally NOT a select */}
                    <input
                      className="form-input"
                      type="text"
                      value={form.technician}
                      onChange={e => setForm(p => ({ ...p, technician: e.target.value }))}
                      placeholder="Enter technician name"
                      maxLength={200}
                      style={{ paddingLeft: 16 }}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Veterinary-only Pregnancy Check modal ---- */}
      {checkPreg && (
        <div className="modal-overlay" onClick={() => setCheckPreg(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 440, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 4, fontSize: '1.05rem', fontWeight: 600 }}><HeartPulse size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />Pregnancy Check</h3>
            <p className="text-secondary" style={{ fontSize: '0.82rem', marginBottom: 14 }}>
              {checkPreg.animal_name} ({checkPreg.tag_number}) · {checkPreg.species_label}
              {checkPreg.days_since_insemination != null ? ` · Day ${checkPreg.days_since_insemination}` : ''}
            </p>
            {checkPreg.species_label === 'Pig' && checkPreg.in_heat_window && (
              <div className="alert" style={{ background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', padding: 8, borderRadius: 6, fontSize: '0.8rem', marginBottom: 12 }}>
                Inside the 18–24 day pig heat-check window — ideal time to confirm.
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Confirm result (Veterinary only) *</label>
              <div style={{ display: 'grid', gap: 8 }}>
                {([
                  { v: 'pregnant', label: 'Pregnant', desc: 'Delivery date auto-calculated for this species' },
                  { v: 'returned_heat', label: 'Returned Heat', desc: 'Animal becomes ready for rebreeding' },
                  { v: 'rebred', label: 'Rebred', desc: 'New insemination + monitoring cycle starts now' },
                ] as const).map(opt => (
                  <label key={opt.v} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 8,
                    border: checkResult === opt.v ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer', background: checkResult === opt.v ? 'var(--primary-light, rgba(22,163,74,.08))' : 'transparent',
                  }}>
                    <input type="radio" name="pregcheck" value={opt.v} checked={checkResult === opt.v} onChange={() => setCheckResult(opt.v)} style={{ marginTop: 3 }} />
                    <span>
                      <strong>{opt.label}</strong>
                      <br /><small className="text-secondary">{opt.desc}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCheckPreg(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={checkMutation.isPending} onClick={() => checkMutation.mutate({ id: checkPreg.id, result: checkResult })}>
                {checkMutation.isPending ? 'Confirming...' : 'Confirm Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
