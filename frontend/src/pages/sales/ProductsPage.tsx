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

interface ProductForm {
  name: string;
  category: string;
  price: string;
  unit: string;
  quantity: string;
  description: string;
}

const initialForm: ProductForm = { name: '', category: '', price: '', unit: '', quantity: '', description: '' };

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-products'],
    queryFn: () => client.get('/sales/products').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/products', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      toast.success('Product created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/sales/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      toast.success('Product updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/sales/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      toast.success('Product deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter((p: any) =>
    `${p.name || ''} ${p.category || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name || '',
      category: p.category || '',
      price: String(p.price || ''),
      unit: p.unit || '',
      quantity: String(p.quantity || ''),
      description: p.description || '',
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this product?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: (p: any) => p.category || '-' },
    { key: 'price', label: 'Price', render: (p: any) => `$${Number(p.price).toFixed(2)}` },
    { key: 'unit', label: 'Unit', render: (p: any) => p.unit || '-' },
    { key: 'quantity', label: 'Quantity', render: (p: any) => Number(p.quantity) ?? 0 },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => handleEdit(p)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Products"
      subtitle="Manage sales products"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> Add Product
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No products found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </FormField>
          <FormField label="Category">
            <input className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          </FormField>
          <FormField label="Price" required>
            <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
          </FormField>
          <FormField label="Unit">
            <input className="form-input" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. pcs, kg, liter" />
          </FormField>
          <FormField label="Quantity" required>
            <input className="form-input" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
          </FormField>
          <FormField label="Description">
            <textarea className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
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
