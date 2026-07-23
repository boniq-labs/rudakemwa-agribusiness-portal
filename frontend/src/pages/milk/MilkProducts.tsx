import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import ModulePage from '../../components/ModulePage';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  description: string;
}

interface FormData {
  name: string;
  category: string;
  price: string;
  quantity: string;
  unit: string;
  description: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  category: '',
  price: '',
  quantity: '',
  unit: 'liter',
  description: '',
};

export default function MilkProducts() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['milk-products'],
    queryFn: () => client.get('/milk/products').then(r => r.data.data || []),
  });

  const products: Product[] = data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/milk/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      setShowModal(false);
      setForm(INITIAL_FORM);
      toast.success('Product created');
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/milk/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      setShowModal(false);
      setEditing(null);
      setForm(INITIAL_FORM);
      toast.success('Product updated');
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/milk/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity) || 0,
      unit: form.unit,
      description: form.description || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category || '',
      price: product.price.toString(),
      quantity: String(product.quantity || 0),
      unit: product.unit,
      description: product.description || '',
      code: product.code || '',
    });

    setForm(prev => ({ ...prev }));
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_FORM);
    setShowModal(true);
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Delete product "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  return (
    <ModulePage
      title="Milk Products"
      subtitle="Manage milk products"
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Product
        </button>
      }
    >
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 140 }}>
              <div style={{ height: 16, width: '60%', background: 'var(--border)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 14, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 24, width: '30%', background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontWeight: 500 }}>No products yet</p>
          <p style={{ fontSize: '0.9rem' }}>Create your first milk product to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {products.map((product) => (
            <div key={product.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{product.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.unit}{product.category ? ` · ${product.category}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(product)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>${product.price}</div>
              {product.quantity > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Qty: {product.quantity}</div>
              )}
              {product.description && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{product.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editing ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Fresh, Yogurt, Cheese" />
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input type="number" step="0.01" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option value="liter">Liter</option>
                  <option value="kg">Kilogram</option>
                  <option value="piece">Piece</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
