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

interface PrescriptionForm {
  animal_id: string;
  medicine: string;
  dosage: string;
  duration: string;
  notes: string;
}

const initialForm: PrescriptionForm = {
  animal_id: '', medicine: '', dosage: '', duration: '', notes: '',
};

export default function Prescriptions() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<PrescriptionForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['vet-prescriptions'],
    queryFn: () => client.get('/veterinary/prescriptions').then(r => r.data.data || []),
  });

  const { data: animals } = useQuery({
    queryKey: ['animals', 'select'],
    queryFn: () => client.get('/animals/select').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/veterinary/prescriptions', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Prescription created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/veterinary/prescriptions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Prescription updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/veterinary/prescriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Prescription deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const animalList = Array.isArray(animals) ? animals : [];

  const filtered = list.filter((p: any) =>
    [p.animal?.tag_number, p.medicine, p.veterinarian]
      .filter(Boolean).some(f => String(f).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, animal_id: Number(form.animal_id) };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (p: any) => {
    setForm({
      animal_id: String(p.animal_id || ''),
      medicine: p.medicine || '',
      dosage: p.dosage || '',
      duration: p.duration || '',
      notes: p.notes || '',
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this prescription?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (p: any) => p.animal?.tag_number || p.animal_id || '-',
    },
    { key: 'medicine', label: 'Medicine', render: (p: any) => p.medicine || '-' },
    { key: 'dosage', label: 'Dosage', render: (p: any) => p.dosage || '-' },
    { key: 'duration', label: 'Duration', render: (p: any) => p.duration ? `${p.duration} days` : '-' },
    { key: 'notes', label: 'Notes', render: (p: any) => p.notes || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => handleEdit(p)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Prescriptions"
      subtitle="Manage treatment prescriptions"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> New Prescription
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search prescriptions..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No prescriptions found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Prescription' : 'New Prescription'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Animal" required>
            <select className="form-input" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
              <option value="">Select animal</option>
              {animalList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.breed || 'N/A'} - {a.species || 'N/A'} - {a.tag_number}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Medicine" required>
            <input className="form-input" value={form.medicine} onChange={e => setForm(p => ({ ...p, medicine: e.target.value }))} required />
          </FormField>
          <div className="form-row">
            <FormField label="Dosage" required>
              <input className="form-input" value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} required placeholder="e.g. 10ml" />
            </FormField>
            <FormField label="Duration (days)">
              <input className="form-input" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} min={1} />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
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
