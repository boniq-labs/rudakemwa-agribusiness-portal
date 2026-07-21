import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { stockAPI, procurementAPI } from '../../api/endpoints';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import type { Column } from '../../components/DataTable';

interface FormData {
  name: string; category_id: string; code: string; barcode: string;
  unit: string; quantity: string; min_stock_level: string; max_stock_level: string;
  purchase_price: string; location_id: string; supplier_id: string;
}

const initialForm: FormData = {
  name: '', category_id: '', code: '', barcode: '', unit: '', quantity: '',
  min_stock_level: '', max_stock_level: '', purchase_price: '', location_id: '', supplier_id: '',
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState<FormData>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: items, isLoading } = useQuery({ queryKey: ['stock-items'], queryFn: () => stockAPI.getItems().then(r => r.data.data || []) });
  const { data: categories } = useQuery({ queryKey: ['stock-categories'], queryFn: () => stockAPI.getCategories().then(r => r.data.data || []) });
  const { data: suppliers } = useQuery({ queryKey: ['procurement-suppliers'], queryFn: () => procurementAPI.getSuppliers().then(r => r.data.data || []) });

  const createMutation = useMutation({
    mutationFn: (data: any) => stockAPI.createItem(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); closeModal(); toast.success('Item created'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to save item' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => stockAPI.updateItem(data.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); closeModal(); toast.success('Item updated'); },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to update item' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stockAPI.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-items'] }); toast.success('Item deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
      quantity: form.quantity ? Number(form.quantity) : 0,
      min_stock_level: form.min_stock_level ? Number(form.min_stock_level) : 0,
      max_stock_level: form.max_stock_level ? Number(form.max_stock_level) : undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (item: any) => {
    setForm({
      name: item.name || '', category_id: String(item.category_id || item.category?.id || ''),
      code: item.code || '', barcode: item.barcode || '', unit: item.unit || '',
      quantity: String(item.quantity || 0), min_stock_level: String(item.min_stock_level || 0),
      max_stock_level: String(item.max_stock_level || ''), purchase_price: String(item.purchase_price || ''),
      location_id: item.location_id ? String(item.location_id) : '', supplier_id: String(item.supplier_id || item.supplier?.id || ''),
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const categoriesList = Array.isArray(categories) ? categories : [];
  const suppliersList = Array.isArray(suppliers) ? suppliers : [];

  const filtered = (items || []).filter((i: any) => {
    const searchStr = `${i.name} ${i.code || ''} ${i.barcode || ''}`.toLowerCase();
    const cat = typeof i.category === 'object' ? String(i.category?.id) : String(i.category_id || '');
    return searchStr.includes(search.toLowerCase()) && (!categoryFilter || cat === categoryFilter);
  });

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: (i: any) => typeof i.category === 'object' ? i.category?.name : i.category || '-' },
    { key: 'quantity', label: 'Qty', render: (i: any) => {
      const low = i.min_stock_level && Number(i.quantity) <= Number(i.min_stock_level);
      const high = i.max_stock_level && Number(i.quantity) >= Number(i.max_stock_level);
      return <span style={low ? { color: 'var(--danger)', fontWeight: 700 } : high ? { color: 'var(--primary)', fontWeight: 700 } : undefined}>{i.quantity}</span>;
    }},
    { key: 'unit', label: 'Unit' },
    { key: 'min_stock_level', label: 'Min Stock' },
    { key: 'purchase_price', label: 'Price', render: (i: any) => i.purchase_price ? Number(i.purchase_price).toLocaleString() : '-' },
    { key: 'status', label: 'Status', render: (i: any) => {
      const qty = Number(i.quantity);
      const min = Number(i.min_stock_level);
      const max = Number(i.max_stock_level);
      let status = 'ok';
      if (min && qty <= min) status = 'low';
      if (max && qty >= max) status = 'high';
      return <StatusBadge status={status} />;
    }},
    { key: 'actions', label: 'Actions', render: (i: any) => (
      <div className="actions">
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(i); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this item?')) deleteMutation.mutate(i.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <ModulePage title="Inventory" subtitle="Manage stock items"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> New Item
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div className="page-search" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '0.9rem' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categoriesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No items found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Item' : 'New Item'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Name" required>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </FormField>
                <FormField label="Category" required>
                  <select name="category_id" value={form.category_id} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categoriesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Code">
                  <input name="code" value={form.code} onChange={handleChange} />
                </FormField>
                <FormField label="Barcode">
                  <input name="barcode" value={form.barcode} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Unit" required>
                  <select name="unit" value={form.unit} onChange={handleChange} required>
                    <option value="">Select unit</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">L</option>
                    <option value="ml">mL</option>
                    <option value="pcs">Pieces</option>
                    <option value="bags">Bags</option>
                    <option value="boxes">Boxes</option>
                    <option value="litres">Litres</option>
                  </select>
                </FormField>
                <FormField label="Quantity" required>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Min Stock Level" required>
                  <input type="number" name="min_stock_level" value={form.min_stock_level} onChange={handleChange} required />
                </FormField>
                <FormField label="Max Stock Level">
                  <input type="number" name="max_stock_level" value={form.max_stock_level} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Purchase Price">
                  <input type="number" step="0.01" name="purchase_price" value={form.purchase_price} onChange={handleChange} />
                </FormField>
                <FormField label="Location">
                  <input name="location_id" value={form.location_id} onChange={handleChange} placeholder="e.g. Warehouse A" />
                </FormField>
              </div>
              <FormField label="Supplier">
                <select name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                  <option value="">Select supplier</option>
                  {suppliersList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
