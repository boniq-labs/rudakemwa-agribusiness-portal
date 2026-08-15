import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Search, ChevronDown } from 'lucide-react';

const CATEGORY_OPTIONS = ['Milk Products'];

interface ProductForm {
  name: string;
  category_name: string;
  price: string;
  unit: string;
  description: string;
}

const initialForm: ProductForm = { name: '', category_name: '', price: '', unit: '', description: '' };

function SearchableCategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery({
    queryKey: ['sales-product-categories'],
    queryFn: () => client.get('/sales/product-categories').then(r => r.data.data || []),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const categoryNames = CATEGORY_OPTIONS.concat(
    (categories || []).map((c: any) => c.name).filter((n: string) => n && !CATEGORY_OPTIONS.includes(n))
  );
  const q = query.trim();
  const filtered = categoryNames.filter(c => c.toLowerCase().includes(q.toLowerCase()));
  const exactMatch = categoryNames.some(c => c.toLowerCase() === q.toLowerCase());

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--card-bg)' }}
      >
        <span style={{ flex: 1, color: value ? 'inherit' : 'var(--text-secondary)' }}>{value || 'Select category'}</span>
        <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '4px 8px' }}>
            <input
              autoFocus
              placeholder="Search category..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', padding: '6px 8px', fontSize: '0.9rem', background: 'transparent', color: 'inherit' }}
            />
          </div>
          <div style={{ maxHeight: 160, overflow: 'auto' }}>
            {q && !exactMatch && (
              <div
                onClick={() => { onChange(q); setOpen(false); setQuery(''); }}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                Create &quot;{q}&quot;
              </div>
            )}
            {filtered.length === 0 && !q && <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No categories match</div>}
            {filtered.map(c => (
              <div
                key={c}
                onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
                style={{ padding: '8px 12px', cursor: 'pointer', background: value === c ? 'var(--primary)' : 'transparent', color: value === c ? '#fff' : 'inherit', fontSize: '0.9rem' }}
                onMouseEnter={e => { if (value !== c) (e.target as HTMLElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { if (value !== c) (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['sales-products'],
    queryFn: () => client.get('/sales/products').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/products', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Product deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter((p: any) =>
    `${p.name || ''} ${p.category_name || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      category_name: form.category_name || undefined,
      price: Number(form.price),
      unit: form.unit || null,
      description: form.description || null,
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name || '',
      category_name: p.category_name || '',
      price: String(p.price || ''),
      unit: p.unit || '',
      description: p.description || '',
    });
    setEditId(p.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this product?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'category_name', label: 'Category', render: (p: any) => p.category_name || '-' },
    { key: 'price', label: 'Price', render: (p: any) => `RWF ${Number(p.price).toLocaleString()}` },
    { key: 'unit', label: 'Unit', render: (p: any) => p.unit || '-' },
    { key: 'quantity_available', label: 'Available (Milk Today)', render: (p: any) => `${Number(p.quantity_available) || 0} L` },
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
          <FormField label="Category" required>
            <SearchableCategorySelect value={form.category_name} onChange={v => setForm(p => ({ ...p, category_name: v }))} />
          </FormField>
          <FormField label="Price" required>
            <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
          </FormField>
          <FormField label="Unit">
            <input className="form-input" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. pcs, kg, liter" />
          </FormField>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8, background: 'var(--primary-light)', padding: '10px 12px', borderRadius: 8 }}>
            Product availability is auto-sourced from today&apos;s Milk Today production. Manual stock is not tracked.
          </p>
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