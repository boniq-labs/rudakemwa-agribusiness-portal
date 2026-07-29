import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Baby, Eye, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

interface BirthRecord {
  id: number;
  animal_id?: number;
  animal_tag?: string;
  animal_name?: string;
  child_name?: string;
  tag_number?: string;
  gender?: string;
  weight?: number;
  color?: string;
  photo?: string;
  birth_date?: string;
  category_id?: number;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Animal {
  id: number;
  tag_number: string;
  name?: string;
  gender?: string;
  animal_category_id?: number;
}

const GENDER_OPTIONS: Record<string, string[]> = {
  Cattle: ['Bull', 'Cow'],
  Pigs: ['Male', 'Female'],
  Dairy: ['Bull', 'Cow'],
  Beef: ['Bull', 'Cow'],
  Goat: ['Male', 'Female'],
  Sheep: ['Male', 'Female'],
  Chicken: ['Male', 'Female'],
  Rabbit: ['Male', 'Female'],
  Horse: ['Male', 'Female'],
  Donkey: ['Male', 'Female'],
  DEFAULT: ['Male', 'Female'],
};

export default function BirthRecords() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<BirthRecord | null>(null);
  const [form, setForm] = useState({
    category_id: '', animal_id: '', child_name: '', tag_number: '', photo: '', gender: '', weight: '', color: '', birth_date: '',
  });

  const { data: birthsData, isLoading } = useQuery({
    queryKey: ['births'],
    queryFn: async () => (await client.get('/animals/births')).data?.data || [],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await client.get('/animals/categories')).data?.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals', 'select'],
    queryFn: async () => (await client.get('/animals/select')).data?.data || [],
  });

  const births: BirthRecord[] = Array.isArray(birthsData) ? birthsData : [];
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];
  const animals: Animal[] = Array.isArray(animalsData) ? animalsData : [];

  const selectedCategory = categories.find((c: Category) => String(c.id) === form.category_id);
  const genderOptions = GENDER_OPTIONS[selectedCategory?.name || ''] || GENDER_OPTIONS.DEFAULT;

  const filteredAnimals = form.category_id
    ? animals.filter((a: Animal) => String(a.animal_category_id) === form.category_id)
    : animals;

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/births', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['births'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Birth record saved and animal registered');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save birth record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/births/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['births'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Birth record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update birth record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/births/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['births'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Birth record deleted');
    },
    onError: () => toast.error('Failed to delete birth record'),
  });

  const resetForm = () => {
    setForm({ category_id: '', animal_id: '', child_name: '', tag_number: '', photo: '', gender: '', weight: '', color: '', birth_date: '' });
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(prev => ({ ...prev, photo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const openEdit = (item: BirthRecord) => {
    setEditingId(item.id);
    setForm({
      category_id: String(item.category_id || ''),
      animal_id: String(item.animal_id || ''),
      child_name: item.child_name || '',
      tag_number: item.tag_number || '',
      photo: item.photo || '',
      gender: item.gender || '',
      weight: item.weight ? String(item.weight) : '',
      color: item.color || '',
      birth_date: item.birth_date ? (typeof item.birth_date === 'string' ? item.birth_date.split('T')[0] : new Date(item.birth_date).toISOString().split('T')[0]) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genderMap: Record<string, string> = { Bull: 'male', Cow: 'female', Male: 'male', Female: 'female' };
    const normGender = genderMap[form.gender] || 'female';
    const payload = {
      mother_id: form.animal_id ? Number(form.animal_id) : undefined,
      animal_name: form.child_name,
      tag_number: form.tag_number,
      photo: form.photo || undefined,
      gender: normGender,
      weight: form.weight ? Number(form.weight) : undefined,
      color: form.color || undefined,
      birth_date: form.birth_date,
      type: form.gender,
      category_id: Number(form.category_id),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<BirthRecord>[] = [
    {
      key: 'child', label: 'Child Name',
      render: (item: any) => item.child_name || '-',
    },
    { key: 'tag_number', label: 'Ear Tag', render: (item: any) => item.tag_number || '-' },
    { key: 'gender', label: 'Gender', render: (item: any) => item.gender || '-' },
    {
      key: 'weight', label: 'Weight',
      render: (item: any) => item.weight ? `${item.weight} kg` : '-',
    },
    { key: 'color', label: 'Color', render: (item: any) => item.color || '-' },
    {
      key: 'birth_date', label: 'DOB',
      render: (item: any) => item.birth_date ? new Date(item.birth_date).toLocaleDateString() : '-',
    },
    { key: 'category_name', label: 'Category', render: (item: any) => item.category_name || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (item: BirthRecord) => (
        <div className="actions">
          <button className="btn btn-sm" title="View" onClick={() => setViewItem(item)}><Eye size={14} /></button>
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this birth record?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Birth Records"
      subtitle="Record and manage animal births"
      actions={<button className="btn btn-primary" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Record Birth</button>}
    >
      <DataTable columns={columns} data={births} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 520, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Baby size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'Record'} Birth</h3>
            <form onSubmit={handleSubmit}>
              <FormField label="Category" required>
                <select className="form-select" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value, animal_id: '', gender: '' }))} required>
                  <option value="">Select category</option>
                  {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Select Animal (Parent)" required>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {filteredAnimals.map((a: Animal) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Child Name" required>
                  <input className="form-input" value={form.child_name} onChange={e => setForm(p => ({ ...p, child_name: e.target.value }))} required placeholder="Newborn name" />
                </FormField>
                <FormField label="Ear Tag" required>
                  <input className="form-input" value={form.tag_number} onChange={e => setForm(p => ({ ...p, tag_number: e.target.value }))} required placeholder="e.g. C-101" />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Gender" required>
                  <select className="form-select" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} required>
                    <option value="">Select gender</option>
                    {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>
                <FormField label="Date of Birth" required>
                  <input className="form-input" type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} required />
                </FormField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Weight (kg)">
                  <input className="form-input" type="number" step="0.01" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
                </FormField>
                <FormField label="Color">
                  <input className="form-input" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="e.g. Brown" />
                </FormField>
              </div>
              <FormField label="Photo">
                <input className="form-input" type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
                {form.photo && <img src={form.photo} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
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

      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Baby size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Birth Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><strong>Child Name:</strong> {viewItem.child_name || '-'}</div>
              <div><strong>Ear Tag:</strong> {viewItem.tag_number || '-'}</div>
              <div><strong>Gender:</strong> {viewItem.gender || '-'}</div>
              <div><strong>Weight:</strong> {viewItem.weight ? `${viewItem.weight} kg` : '-'}</div>
              <div><strong>Color:</strong> {viewItem.color || '-'}</div>
              <div><strong>DOB:</strong> {viewItem.birth_date ? new Date(viewItem.birth_date).toLocaleDateString() : '-'}</div>
              <div><strong>Category:</strong> {(viewItem as any).category_name || '-'}</div>
              {viewItem.photo && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Photo:</strong><br />
                  <img src={viewItem.photo} alt="Offspring" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 4 }} />
                </div>
              )}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
