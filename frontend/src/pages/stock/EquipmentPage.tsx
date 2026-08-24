import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { stockAPI } from '../../api/endpoints';
import { Plus, X, Wrench, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface FormData {
  name: string; serial_number: string; type: string; condition: string;
  status: string; location: string; purchase_date: string; purchase_price: string; notes: string;
}

interface MaintForm {
  equipment_id: string; maintenance_type: string; description: string;
  cost: string; performed_by: string; maintenance_date: string; next_maintenance_date: string;
}

const initialForm: FormData = {
  name: '', serial_number: '', type: '', condition: 'Good', status: 'Available',
  location: '', purchase_date: '', purchase_price: '', notes: '',
};

const initialMaint: MaintForm = {
  equipment_id: '', maintenance_type: '', description: '', cost: '', performed_by: '', maintenance_date: '', next_maintenance_date: '',
};

const STATUS_TABS = ['All', 'Available', 'In Use', 'Damaged', 'Maintenance', 'Disposed'];
const TYPES = ['Milking Machine', 'Cooling Tank', 'Feeder', 'Waterer', 'Fencing', 'Vehicle', 'Generator', 'Pump', 'Scale', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
const MAINT_TYPES = ['Routine', 'Repair', 'Inspection', 'Emergency'];

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [statusTab, setStatusTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showMaint, setShowMaint] = useState<{ show: boolean; equipId?: number }>({ show: false });
  const [form, setForm] = useState<FormData>(initialForm);
  const [maintForm, setMaintForm] = useState<MaintForm>(initialMaint);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: equipment, isLoading } = useQuery({ queryKey: ['stock-equipment'], queryFn: () => stockAPI.getEquipment().then(r => r.data.data || []) });

  const invalidateDashboard = () => queryClient.invalidateQueries({ queryKey: ['stock-dashboard-stats'] });

  const createMutation = useMutation({
    mutationFn: (data: any) => stockAPI.createEquipment(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-equipment'] }); invalidateDashboard(); setShowModal(false); setForm(initialForm); setErrors({}); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to create equipment' }); },
  });

  const maintMutation = useMutation({
    mutationFn: (data: any) => stockAPI.recordMaintenance(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-equipment'] }); invalidateDashboard(); setShowMaint({ show: false }); setMaintForm(initialMaint); },
    onError: (err: any) => { setErrors({ maint: err.response?.data?.message || 'Failed to record maintenance' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stockAPI.updateEquipment(data.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-equipment'] }); invalidateDashboard(); closeModal(); toast.success('Equipment updated'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to update equipment' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stockAPI.deleteEquipment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-equipment'] }); invalidateDashboard(); toast.success('Equipment deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete equipment'),
  });

  const filtered = statusTab === 'All' ? (equipment || []) : (equipment || []).filter((e: any) => e.status === statusTab);

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const openEdit = (item: any) => {
    setForm({ name: item.name || '', serial_number: item.serial_number || '', type: item.type || '', condition: item.condition || 'Good', status: item.status || 'Available', location: item.location || '', purchase_date: item.purchase_date || '', purchase_price: String(item.purchase_price || ''), notes: item.notes || '' });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMaintChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setMaintForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload = { ...form, purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    maintMutation.mutate({
      maintenance_type: maintForm.maintenance_type,
      description: maintForm.description,
      cost: maintForm.cost ? Number(maintForm.cost) : undefined,
      performed_by: maintForm.performed_by,
      maintenance_date: maintForm.maintenance_date,
      next_maintenance_date: maintForm.next_maintenance_date || undefined,
      equipment_id: showMaint.equipId,
    });
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'serial_number', label: 'Serial #', render: (e: any) => e.serial_number || '-' },
    { key: 'type', label: 'Type', render: (e: any) => e.type || '-' },
    { key: 'condition', label: 'Condition', render: (e: any) => e.condition || '-' },
    { key: 'status', label: 'Status', render: (e: any) => <StatusBadge status={e.status || 'Available'} /> },
    { key: 'location', label: 'Location', render: (e: any) => e.location || '-' },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (e: any) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); setMaintForm({ ...initialMaint, equipment_id: String(e.id) }); setShowMaint({ show: true, equipId: e.id }); setErrors({}); }}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <Wrench size={14} />
          </button>
          <button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={async (ev) => { ev.stopPropagation(); if (await confirm('Delete this equipment?')) deleteMutation.mutate(e.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage title="Equipment" subtitle="Manage farm equipment and machinery"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); setErrors({}); }}>
          <Plus size={16} /> New Equipment
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setStatusTab(tab)}
            className={`btn btn-sm`}
            style={{
              background: statusTab === tab ? 'var(--primary)' : 'var(--card-bg)',
              color: statusTab === tab ? '#fff' : 'var(--text)',
              border: '1px solid', borderColor: statusTab === tab ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {tab} {tab !== 'All' ? `(${(equipment || []).filter((e: any) => e.status === tab).length})` : `(${(equipment || []).length})`}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No equipment found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Equipment' : 'New Equipment'}</h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Name" required>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </FormField>
                <FormField label="Serial Number">
                  <input name="serial_number" value={form.serial_number} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Type" required>
                  <select name="type" value={form.type} onChange={handleChange} required>
                    <option value="">Select type</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
                <FormField label="Status" required>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Condition">
                  <select name="condition" value={form.condition} onChange={handleChange}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Location">
                  <input name="location" value={form.location} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Purchase Date">
                  <input type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} />
                </FormField>
                <FormField label="Purchase Price">
                  <input type="number" step="0.01" name="purchase_price" value={form.purchase_price} onChange={handleChange} />
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Equipment' : 'Create Equipment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaint.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowMaint({ show: false })}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 520, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Maintenance</h2>
              <button onClick={() => setShowMaint({ show: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleMaintSubmit}>
              <FormField label="Maintenance Type" required>
                <select name="maintenance_type" value={maintForm.maintenance_type} onChange={handleMaintChange} required>
                  <option value="">Select type</option>
                  {MAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Description" required>
                <textarea name="description" value={maintForm.description} onChange={handleMaintChange} rows={3} required />
              </FormField>
              <div className="form-row">
                <FormField label="Cost">
                  <input type="number" step="0.01" name="cost" value={maintForm.cost} onChange={handleMaintChange} />
                </FormField>
                <FormField label="Performed By">
                  <input name="performed_by" value={maintForm.performed_by} onChange={handleMaintChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Maintenance Date" required>
                  <input type="date" name="maintenance_date" value={maintForm.maintenance_date} onChange={handleMaintChange} required />
                </FormField>
                <FormField label="Next Maintenance">
                  <input type="date" name="next_maintenance_date" value={maintForm.next_maintenance_date} onChange={handleMaintChange} />
                </FormField>
              </div>
              {errors.maint && <div className="alert alert-error">{errors.maint}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowMaint({ show: false })}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={maintMutation.isPending}>{maintMutation.isPending ? 'Saving...' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
