import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function AnimalCategories() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['animal-categories'],
    queryFn: async () => (await client.get('/animals/categories')).data.data || [],
  });

  const categories = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/categories', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animal-categories'] }); closeModal(); toast.success('Category created'); },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: number; data: any }) => client.put(`/animals/categories/${id}`, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animal-categories'] }); closeModal(); toast.success('Category updated'); },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animal-categories'] }); toast.success('Category deleted'); },
    onError: () => toast.error('Failed to delete category'),
  });

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '' }); setShowModal(true); };

  const openEdit = (item: any) => { setEditItem(item); setForm({ name: item.name, description: item.description || '' }); setShowModal(true); };

  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItem) updateMutation.mutate({ id: editItem.id, data: form });
    else createMutation.mutate(form);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'actions', label: 'Actions',
      render: (item) => (
        <div className="actions">
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}><Edit2 size={14} /> Edit</button>
          <button className="btn btn-sm btn-danger" onClick={async () => { if (await confirm('Delete this category? It will be soft-deleted.')) deleteMutation.mutate(item.id); }} disabled={deleteMutation.isPending}><Trash2 size={14} /> Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Animal Categories"
      subtitle="Manage animal categories"
      actions={<button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Category</button>}
    >
      <DataTable columns={columns} data={categories} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 480, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}>{editItem ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSubmit}>
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
