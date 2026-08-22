import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Search } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAnimalSelect, animalSelectStateOptions } from '../../hooks/useAnimalSelect';

interface TreatmentForm {
  animal_id: string;
  diagnosis: string;
  treatment: string;
  medicine: string;
  date: string;
  veterinarian: string;
  follow_up_date: string;
  notes: string;
}

const initialForm: TreatmentForm = {
  animal_id: '', diagnosis: '', treatment: '', medicine: '',
  date: new Date().toISOString().split('T')[0],
  veterinarian: '', follow_up_date: '', notes: '',
};

export default function TreatmentRecords() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TreatmentForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['vet-treatments'],
    queryFn: () => client.get('/veterinary/treatments').then(r => r.data.data || []),
  });

  const animalSelect = useAnimalSelect();
  const animals = animalSelect.animals;

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/veterinary/treatments', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-treatments'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/veterinary/treatments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-treatments'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/veterinary/treatments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-treatments'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const records = Array.isArray(data) ? data : [];
  const animalList = Array.isArray(animals) ? animals : [];

  const filtered = records.filter((t: any) =>
    [t.animal?.tag_number, t.diagnosis, t.medicine, t.veterinarian]
      .filter(Boolean).some(f => String(f).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, animal_id: Number(form.animal_id) };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (t: any) => {
    const toDateStr = (d: any) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0]; };
    setForm({
      animal_id: String(t.animal_id || ''),
      diagnosis: t.diagnosis || '',
      treatment: t.treatment || '',
      medicine: t.medicine || '',
      date: toDateStr(t.treatment_date || t.date),
      veterinarian: t.veterinarian || '',
      follow_up_date: toDateStr(t.follow_up_date),
      notes: t.notes || '',
    });
    setEditId(t.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this treatment record?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (t: any) => t.animal?.tag_number || t.animal_id || '-',
    },
    { key: 'diagnosis', label: 'Diagnosis', render: (t: any) => t.diagnosis || '-' },
    { key: 'treatment', label: 'Treatment', render: (t: any) => t.treatment || '-' },
    { key: 'medicine', label: 'Medicine', render: (t: any) => t.medicine || '-' },
    {
      key: 'date', label: 'Date',
      render: (t: any) => t.date ? new Date(t.date).toLocaleDateString() : '-',
    },
    { key: 'veterinarian', label: 'Vet', render: (t: any) => t.veterinarian || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (t: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => handleEdit(t)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Treatment Records"
      subtitle="Manage animal treatment records"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> New Treatment
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search treatments..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No treatment records found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Treatment' : 'New Treatment'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Animal" required>
            <select className="form-input" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
              <option value="">Select animal</option>
                  {animalSelectStateOptions(animalSelect).map(o => <option key={o.label} value={o.value} disabled>{o.label}</option>)}
              {animalList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Diagnosis" required>
            <input className="form-input" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} required />
          </FormField>
          <FormField label="Treatment" required>
            <input className="form-input" value={form.treatment} onChange={e => setForm(p => ({ ...p, treatment: e.target.value }))} required />
          </FormField>
          <FormField label="Medicine">
            <input className="form-input" value={form.medicine} onChange={e => setForm(p => ({ ...p, medicine: e.target.value }))} />
          </FormField>
          <div className="form-row">
            <FormField label="Date" required>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </FormField>
            <FormField label="Follow-up Date">
              <input className="form-input" type="date" value={form.follow_up_date} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Veterinarian" required>
            <input className="form-input" value={form.veterinarian} onChange={e => setForm(p => ({ ...p, veterinarian: e.target.value }))} required />
          </FormField>
          <FormField label="Notes">
            <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </FormField>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {editId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </ModulePage>
  );
}
