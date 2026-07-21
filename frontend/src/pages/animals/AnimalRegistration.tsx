import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import { animalAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import ModulePage from '../../components/ModulePage';

export default function AnimalRegistration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const typeParam = searchParams.get('type');

  const { data: categoriesData } = useQuery({
    queryKey: ['animal-categories'],
    queryFn: async () => (await animalAPI.getCategories()).data.data || [],
  });
  const { data: breedsData } = useQuery({
    queryKey: ['animal-breeds'],
    queryFn: async () => (await animalAPI.getBreeds()).data.data || [],
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const breeds = Array.isArray(breedsData) ? breedsData : [];

  const FEED_TYPES = ['Starter', 'Grower', 'Finisher', 'Concentrate', 'Hay', 'Silage', 'Grass', 'Other'];
  const STATUSES = ['Pregnant', 'Not Pregnant', 'Sick', 'Healthy'];
  const GENDERS = ['Male', 'Female'];

  const [form, setForm] = useState({
    tag_number: '', name: '', animal_category_id: '', breed_id: '',
    gender: '', color: '', date_of_birth: '', weight: '', height: '',
    photo: '', feed_type: '', animal_status: '', source: 'born',
    purchase_price: '', registration_date: '',
  });

  useEffect(() => {
    if (typeParam && categories.length > 0) {
      const cat = categories.find((c: any) => c.name.toLowerCase() === typeParam.toLowerCase());
      if (cat) setForm(prev => ({ ...prev, animal_category_id: String(cat.id) }));
    }
  }, [typeParam, categories]);

  useEffect(() => {
    if (editId) {
      client.get(`/animals/${editId}`).then(r => {
        const a = r.data?.data || r.data;
        if (a) {
          setForm({
            tag_number: a.tag_number || '', name: a.name || '',
            animal_category_id: String(a.animal_category_id || ''),
            breed_id: String(a.breed_id || ''),
            gender: a.gender || '', color: a.color || '',
            date_of_birth: a.date_of_birth ? a.date_of_birth.split('T')[0] : '',
            weight: String(a.weight || ''), height: String(a.height || ''),
            photo: a.photo || '', feed_type: a.feed_type || '',
            animal_status: a.animal_status || '',
            source: a.source || 'born', purchase_price: String(a.purchase_price || ''),
            registration_date: a.created_at ? a.created_at.split('T')[0] : '',
          });
        }
      }).catch(() => {});
    }
  }, [editId]);

  const filteredBreeds = form.animal_category_id
    ? breeds.filter((b: any) => b.category_id === Number(form.animal_category_id))
    : breeds;

  const getCategoryPath = (categoryId: number) => {
    const cat = categories.find((c: any) => c.id === categoryId);
    if (!cat) return '/animals/pigs';
    const name = (cat.name || '').toLowerCase();
    if (name === 'cattle' || name === 'dairy' || name === 'beef') return '/animals/cattle';
    return '/animals/pigs';
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/animals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast.success('Animal registered successfully');
      const categoryId = Number(form.animal_category_id);
      navigate(getCategoryPath(categoryId));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to register animal'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/animals/${editId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Animal updated successfully');
      const categoryId = Number(form.animal_category_id);
      navigate(getCategoryPath(categoryId));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update animal'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      animal_category_id: Number(form.animal_category_id) || undefined,
      breed_id: Number(form.breed_id) || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      height: form.height ? Number(form.height) : undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
      date_of_birth: form.date_of_birth || undefined,
    };
    if (editId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ModulePage title={editId ? 'Edit Animal' : 'Register New Animal'} subtitle={editId ? 'Update animal information' : 'Add a new animal to the farm'}>
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>Basic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Animal Type *</label>
              <select className="form-select" value={form.animal_category_id} onChange={e => { update('animal_category_id', e.target.value); update('breed_id', ''); }} required>
                <option value="">Select type</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Animal name" />
            </div>
            <div className="form-group">
              <label className="form-label">Ear Tag *</label>
              <input className="form-input" value={form.tag_number} onChange={e => update('tag_number', e.target.value)} required placeholder="e.g. C-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-select" value={form.gender} onChange={e => update('gender', e.target.value)} required>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Breed Type</label>
              <select className="form-select" value={form.breed_id} onChange={e => update('breed_id', e.target.value)}>
                <option value="">Select breed</option>
                {filteredBreeds.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Feed Type</label>
              <select className="form-select" value={form.feed_type} onChange={e => update('feed_type', e.target.value)}>
                <option value="">Select feed type</option>
                {FEED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={form.animal_status} onChange={e => update('animal_status', e.target.value)} required>
                <option value="">Select status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Origin</label>
              <select className="form-select" value={form.source} onChange={e => update('source', e.target.value)}>
                <option value="born">Born</option>
                <option value="purchased">Purchased</option>
                <option value="transferred">Transferred</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" type="number" step="0.01" value={form.weight} onChange={e => update('weight', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" type="number" step="0.01" value={form.height} onChange={e => update('height', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Price</label>
              <input className="form-input" type="number" step="0.01" value={form.purchase_price} onChange={e => update('purchase_price', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Date</label>
              <input className="form-input" type="date" value={form.registration_date} onChange={e => update('registration_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" value={form.color} onChange={e => update('color', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : editId ? 'Update Animal' : 'Register Animal'}
          </button>
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="form-error" style={{ color: 'var(--danger)', marginTop: 12 }}>
            {((createMutation.error || updateMutation.error) as any)?.message || 'Failed to save animal'}
          </p>
        )}
      </form>
    </ModulePage>
  );
}
