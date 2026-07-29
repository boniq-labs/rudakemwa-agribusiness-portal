import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface CategoryForm { name: string; description: string; }

const initialForm: CategoryForm = { name: '', description: '' };

export default function StockCategories() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['stock-categories'],
    queryFn: () => client.get('/stock/categories').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/stock/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
      toast.success('Category created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/stock/categories/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      setErrors({});
      toast.success('Category updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/stock/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = async (item: any) => {
    if (await confirm(`Delete category "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (c: any) => c.description || '-' },
    {
      key: 'actions', label: 'Actions',
      render: (c: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(c); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(c); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Stock Categories"
      subtitle="Manage stock categories"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Category
        </button>
      }
    >
      <DataTable columns={columns} data={categories || []} loading={isLoading} emptyMessage="No categories found" />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required>
                <input name="name" value={form.name} onChange={handleChange} required />
              </FormField>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
