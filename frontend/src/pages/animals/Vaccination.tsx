import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Syringe, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface VaccinationRecord {
  id: number;
  animal_id: number;
  date?: string;
  vaccine_name: string;
  batch_number?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
  animal_name?: string;
  tag_number?: string;
  next_due_date?: string;
}

export default function Vaccination() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', vaccination_date: '', vaccine_name: '', batch_number: '', veterinarian: '', next_due_date: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: async () => (await client.get('/animals/vaccinations')).data?.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data?.data || [],
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await client.get('/users')).data?.data || [],
  });

  const vaccinations: VaccinationRecord[] = Array.isArray(data) ? data : [];
  const animals: any[] = Array.isArray(animalsData) ? animalsData : [];
  const users: any[] = Array.isArray(usersData) ? usersData : [];
  const veterinarians = users.filter((u: any) => u.role === 'veterinarian' || u.role === 'veterinary');

  const dueVaccinations = vaccinations.filter((v: VaccinationRecord) => {
    if (!v.next_due_date) return false;
    return new Date(v.next_due_date) <= new Date(Date.now() + 30 * 86400000);
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/vaccinations', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Vaccination record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save vaccination record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/vaccinations/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Vaccination record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update vaccination record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/vaccinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Vaccination record deleted');
    },
    onError: () => toast.error('Failed to delete vaccination record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', vaccination_date: '', vaccine_name: '', batch_number: '', veterinarian: '', next_due_date: '', notes: '' });
  };

  const openEdit = (item: VaccinationRecord) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      vaccination_date: item.date ? item.date.split('T')[0] : '',
      vaccine_name: item.vaccine_name || '',
      batch_number: item.batch_number || '',
      veterinarian: item.veterinarian || '',
      next_due_date: item.next_due_date ? item.next_due_date.split('T')[0] : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      vaccination_date: form.vaccination_date,
      vaccine_name: form.vaccine_name,
      batch_number: form.batch_number || undefined,
      veterinarian: form.veterinarian ? Number(form.veterinarian) : undefined,
      next_due_date: form.next_due_date || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<VaccinationRecord>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    { key: 'vaccine_name', label: 'Vaccine' },
    {
      key: 'date', label: 'Date',
      render: (item: VaccinationRecord) => item.date ? new Date(item.date).toLocaleDateString() : '-',
    },
    { key: 'batch_number', label: 'Batch', render: (item: any) => item.batch_number || '-' },
    { key: 'veterinarian', label: 'Vet', render: (item: any) => { const name = item.vet_first_name ? `${item.vet_first_name} ${item.vet_last_name || ''}`.trim() : ''; return name || item.veterinarian || '-'; } },
    {
      key: 'next_due_date', label: 'Next Due',
      render: (item: any) => item.next_due_date ? new Date(item.next_due_date).toLocaleDateString() : '-',
    },
    { key: 'notes', label: 'Notes', render: (item: any) => item.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (item: VaccinationRecord) => (
        <div className="actions">
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this vaccination record?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Vaccination Management"
      subtitle="Manage animal vaccinations"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Vaccination</button>}
    >
      {dueVaccinations.length > 0 && (
        <div className="alert" style={{ background: '#fef9c3', border: '1px solid #fde68a', color: '#854d0e', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={20} />
          <span><strong>{dueVaccinations.length}</strong> vaccination(s) due or upcoming</span>
        </div>
      )}

      <DataTable columns={columns} data={vaccinations} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Syringe size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Vaccination</h3>
            <form onSubmit={handleSubmit}>
              <FormField label="Animal" required>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Vaccination Date" required>
                <input className="form-input" type="date" value={form.vaccination_date} onChange={e => setForm(p => ({ ...p, vaccination_date: e.target.value }))} required />
              </FormField>
              <FormField label="Vaccine Name" required>
                <input className="form-input" value={form.vaccine_name} onChange={e => setForm(p => ({ ...p, vaccine_name: e.target.value }))} required />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Batch Number">
                  <input className="form-input" value={form.batch_number} onChange={e => setForm(p => ({ ...p, batch_number: e.target.value }))} />
                </FormField>
                <FormField label="Next Due Date">
                  <input className="form-input" type="date" value={form.next_due_date} onChange={e => setForm(p => ({ ...p, next_due_date: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="Veterinarian">
                <select className="form-select" value={form.veterinarian} onChange={e => setForm(p => ({ ...p, veterinarian: e.target.value }))}>
                  <option value="">Select veterinarian</option>
                  {veterinarians.length === 0 && users.map((u: any) => (
                    <option key={u.id} value={u.id || u.name}>{u.firstName ? `${u.firstName} ${u.lastName}` : u.name || u.email}</option>
                  ))}
                  {veterinarians.length > 0 && veterinarians.map((u: any) => (
                    <option key={u.id} value={String(u.id)}>{u.firstName ? `${u.firstName} ${u.lastName}` : u.name || u.email}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Notes">
                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </FormField>
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
