import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalAPI } from '../../api/endpoints';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

export default function BreedManagement() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category_id: '', description: '' });

  const { data: breedsData, isLoading } = useQuery({
    queryKey: ['animal-breeds'],
    queryFn: async () => (await animalAPI.getBreeds()).data.data || [],
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['animal-categories'],
    queryFn: async () => (await animalAPI.getCategories()).data.data || [],
  });

  const breeds = Array.isArray(breedsData) ? breedsData : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const filtered = search
    ? breeds.filter((b: any) =>
        `${b.name || ''} ${b.category_name || ''} ${b.description || ''}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : breeds;

  const createMutation = useMutation({
    mutationFn: (d: any) => animalAPI.createBreed(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animal-breeds'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: number; data: any }) => client.put(`/animals/breeds/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animal-breeds'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/breeds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animal-breeds'] }),
  });

  const openCreate = () => { setEditItem(null); setForm({ name: '', category_id: '', description: '' }); setShowModal(true); };

  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, category_id: String(item.category_id), description: item.description || '' }); setShowModal(true); };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, category_id: Number(form.category_id) };
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload });
    else createMutation.mutate(payload);
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'category_name', label: 'Category', render: (item) => item.category_name || '-' },
    { key: 'name', label: 'Breed Name' },
    { key: 'description', label: 'Description', render: (item) => item.description || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (item) => (
        <div className="actions" style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}><Edit2 size={14} /> Edit</button>
          <button className="btn btn-sm" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={async () => { if (await confirm('Delete this breed?')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Breed Management"
      subtitle="Manage animal breeds"
      actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Breed</button>}
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search breeds..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No breeds found" />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>{editItem ? 'Edit Breed' : 'New Breed'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
