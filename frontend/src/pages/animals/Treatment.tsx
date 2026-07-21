import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Pill, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TreatmentRecord {
  id: number;
  animal_id: number;
  disease_id?: number;
  treatment_description?: string;
  medicine?: string;
  treatment_date?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
  animal_name?: string;
  tag_number?: string;
  disease_name?: string;
}

export default function Treatment() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', disease_id: '', treatment_description: '', medicine: '', treatment_date: '', veterinarian: '', cost: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => (await client.get('/animals/treatments')).data?.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals')).data?.data || [],
  });

  const { data: diseasesData } = useQuery({
    queryKey: ['diseases'],
    queryFn: async () => (await client.get('/animals/diseases')).data?.data || [],
  });

  const treatments: TreatmentRecord[] = Array.isArray(data) ? data : [];
  const animals: any[] = Array.isArray(animalsData) ? animalsData : [];
  const diseases: any[] = Array.isArray(diseasesData) ? diseasesData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/treatments', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save treatment record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/treatments/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update treatment record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/treatments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Treatment record deleted');
    },
    onError: () => toast.error('Failed to delete treatment record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', disease_id: '', treatment_description: '', medicine: '', treatment_date: '', veterinarian: '', cost: '', notes: '' });
  };

  const openEdit = (item: TreatmentRecord) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      disease_id: item.disease_id ? String(item.disease_id) : '',
      treatment_description: (item as any).treatment_description || '',
      medicine: item.medicine || '',
      treatment_date: (item as any).treatment_date ? (item as any).treatment_date.split('T')[0] : '',
      veterinarian: item.veterinarian || '',
      cost: item.cost ? String(item.cost) : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      disease_id: form.disease_id ? Number(form.disease_id) : undefined,
      treatment_description: form.treatment_description || undefined,
      medicine: form.medicine || undefined,
      treatment_date: form.treatment_date || undefined,
      veterinarian: form.veterinarian || undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<TreatmentRecord>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    {
      key: 'disease', label: 'Disease',
      render: (item: any) => item.disease_name || item.disease_id || '-',
    },
    {
      key: 'treatment_description', label: 'Description',
      render: (item: any) => item.treatment_description || '-',
    },
    { key: 'medicine', label: 'Medicine', render: (item: any) => item.medicine || '-' },
    {
      key: 'treatment_date', label: 'Date',
      render: (item: any) => item.treatment_date ? new Date(item.treatment_date).toLocaleDateString() : '-',
    },
    { key: 'veterinarian', label: 'Vet', render: (item: any) => item.veterinarian || '-' },
    {
      key: 'cost', label: 'Cost',
      render: (item: any) => item.cost ? `$${Number(item.cost).toFixed(2)}` : '-',
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: TreatmentRecord) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={() => { if (confirm('Delete this treatment record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Treatment Records"
      subtitle="Record animal treatments"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> New Treatment</button>}
    >
      <DataTable columns={columns} data={treatments} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 520, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Pill size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'New'} Treatment</h3>
            <form onSubmit={handleSubmit}>
              <FormField label="Animal" required>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Disease">
                <select className="form-select" value={form.disease_id} onChange={e => setForm(p => ({ ...p, disease_id: e.target.value }))}>
                  <option value="">Select disease</option>
                  {diseases.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.disease_name || d.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Treatment Description">
                <textarea className="form-input" rows={2} value={form.treatment_description} onChange={e => setForm(p => ({ ...p, treatment_description: e.target.value }))} placeholder="Describe the treatment" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Medicine">
                  <input className="form-input" value={form.medicine} onChange={e => setForm(p => ({ ...p, medicine: e.target.value }))} placeholder="Enter medicine name" />
                </FormField>
                <FormField label="Treatment Date">
                  <input className="form-input" type="date" value={form.treatment_date} onChange={e => setForm(p => ({ ...p, treatment_date: e.target.value }))} />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Veterinarian Name">
                  <input className="form-input" value={form.veterinarian} onChange={e => setForm(p => ({ ...p, veterinarian: e.target.value }))} placeholder="Enter veterinarian name" />
                </FormField>
                <FormField label="Cost ($)">
                  <input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
                </FormField>
              </div>
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
