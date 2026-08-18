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

interface HealthForm {
  animal_id: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  date: string;
  veterinarian: string;
  status: string;
}

const initialForm: HealthForm = {
  animal_id: '', diagnosis: '', symptoms: '', treatment: '',
  date: new Date().toISOString().split('T')[0],
  veterinarian: '', status: 'open',
};

export default function HealthRecords() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<HealthForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['vet-health-records'],
    queryFn: () => client.get('/veterinary/health-records').then(r => r.data.data || []),
  });

  const { data: animals } = useQuery({
    queryKey: ['animals', 'select'],
    queryFn: () => client.get('/animals/select').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/veterinary/health-records', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-health-records'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Health record created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/veterinary/health-records/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-health-records'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Health record updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const confirm = useConfirm();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/veterinary/health-records/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-health-records'] });
      queryClient.invalidateQueries({ queryKey: ['vet-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Health record deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const records = Array.isArray(data) ? data : [];
  const animalList = Array.isArray(animals) ? animals : [];

  const filtered = records.filter((r: any) =>
    [r.animal?.tag_number, r.diagnosis, r.veterinarian, r.status]
      .filter(Boolean).some(f => String(f).toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, animal_id: Number(form.animal_id) };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (r: any) => {
    const toDateStr = (d: any) => { if (!d) return ''; const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0]; };
    setForm({
      animal_id: String(r.animal_id || ''),
      diagnosis: r.diagnosis || '',
      symptoms: r.symptoms || '',
      treatment: r.treatment || '',
      date: toDateStr(r.checkup_date || r.date),
      veterinarian: r.veterinarian || '',
      status: r.status || 'open',
    });
    setEditId(r.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this record?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (r: any) => r.animal?.tag_number || r.animal_id || '-',
    },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'symptoms', label: 'Symptoms', render: (r: any) => r.symptoms || '-' },
    {
      key: 'date', label: 'Date',
      render: (r: any) => r.date ? new Date(r.date).toLocaleDateString() : '-',
    },
    { key: 'veterinarian', label: 'Veterinarian', render: (r: any) => r.veterinarian || '-' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => handleEdit(r)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Health Records"
      subtitle="Manage animal health records"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> New Record
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No health records found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Health Record' : 'New Health Record'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Animal" required>
            <select className="form-input" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
              <option value="">Select animal</option>
              {animalList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name || 'Unnamed'} — {a.tag_number}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Diagnosis" required>
            <input className="form-input" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} required />
          </FormField>
          <FormField label="Symptoms">
            <input className="form-input" value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
          </FormField>
          <FormField label="Treatment">
            <input className="form-input" value={form.treatment} onChange={e => setForm(p => ({ ...p, treatment: e.target.value }))} />
          </FormField>
          <div className="form-row">
            <FormField label="Date" required>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </FormField>
            <FormField label="Status">
              <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </FormField>
          </div>
          <FormField label="Veterinarian" required>
            <input className="form-input" value={form.veterinarian} onChange={e => setForm(p => ({ ...p, veterinarian: e.target.value }))} required />
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
