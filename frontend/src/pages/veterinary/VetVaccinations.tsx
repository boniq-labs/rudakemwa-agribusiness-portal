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

interface VaccinationForm {
  animal_id: string;
  vaccine_name: string;
  vaccination_date: string;
  next_due_date: string;
  veterinarian: string;
  cost: string;
  notes: string;
}

const initialForm: VaccinationForm = {
  animal_id: '', vaccine_name: '',
  vaccination_date: new Date().toISOString().split('T')[0],
  next_due_date: '', veterinarian: '', cost: '', notes: '',
};

export default function VetVaccinations() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<VaccinationForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['vet-vaccinations'],
    queryFn: () => client.get('/veterinary/vaccinations').then(r => r.data.data || []),
  });

  const { data: animals } = useQuery({
    queryKey: ['animals-select'],
    queryFn: () => client.get('/animals').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/veterinary/vaccinations', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-vaccinations'] });
      toast.success('Vaccination recorded');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/veterinary/vaccinations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-vaccinations'] });
      toast.success('Vaccination updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/veterinary/vaccinations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-vaccinations'] });
      toast.success('Vaccination deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const animalList = Array.isArray(animals) ? animals : [];

  const filtered = list.filter((v: any) =>
    [v.vaccine_name, v.tag_number, v.animal_name, v.veterinarian]
      .filter(Boolean).some(f => String(f).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      animal_id: Number(form.animal_id),
      cost: form.cost ? Number(form.cost) : undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (v: any) => {
    setForm({
      animal_id: String(v.animal_id || ''),
      vaccine_name: v.vaccine_name || '',
      vaccination_date: v.vaccination_date ? v.vaccination_date.split('T')[0] : '',
      next_due_date: v.next_due_date ? v.next_due_date.split('T')[0] : '',
      veterinarian: v.veterinarian || '',
      cost: String(v.cost || ''),
      notes: v.notes || '',
    });
    setEditId(v.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this vaccination record?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (v: any) => v.tag_number || v.animal_name || `#${v.animal_id}`,
    },
    { key: 'vaccine_name', label: 'Vaccine' },
    {
      key: 'vaccination_date', label: 'Date',
      render: (v: any) => v.vaccination_date ? new Date(v.vaccination_date).toLocaleDateString() : '-',
    },
    {
      key: 'next_due_date', label: 'Next Due',
      render: (v: any) => v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : '-',
    },
    { key: 'veterinarian', label: 'Vet', render: (v: any) => v.veterinarian || '-' },
    {
      key: 'cost', label: 'Cost',
      render: (v: any) => v.cost ? `$${Number(v.cost).toFixed(2)}` : '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (v: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => handleEdit(v)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Vaccinations"
      subtitle="Manage vaccination records"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> Record Vaccination
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search vaccinations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No vaccination records found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Vaccination' : 'Record Vaccination'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Animal" required>
            <select className="form-input" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
              <option value="">Select animal</option>
              {animalList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.tag_number || a.name || `Animal #${a.id}`}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Vaccine Name" required>
            <input className="form-input" value={form.vaccine_name} onChange={e => setForm(p => ({ ...p, vaccine_name: e.target.value }))} required />
          </FormField>
          <div className="form-row">
            <FormField label="Vaccination Date" required>
              <input className="form-input" type="date" value={form.vaccination_date} onChange={e => setForm(p => ({ ...p, vaccination_date: e.target.value }))} required />
            </FormField>
            <FormField label="Next Due Date">
              <input className="form-input" type="date" value={form.next_due_date} onChange={e => setForm(p => ({ ...p, next_due_date: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Veterinarian" required>
            <input className="form-input" value={form.veterinarian} onChange={e => setForm(p => ({ ...p, veterinarian: e.target.value }))} required />
          </FormField>
          <FormField label="Cost">
            <input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
          </FormField>
          <FormField label="Notes">
            <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </FormField>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
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
