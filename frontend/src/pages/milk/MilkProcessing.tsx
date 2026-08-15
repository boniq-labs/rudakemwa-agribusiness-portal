import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react';
import ModulePage from '../../components/ModulePage';
import { useConfirm } from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { milkAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

interface ProcessingRecord {
  id: number;
  collection_id: number;
  product_name: string;
  input_quantity: number;
  output_quantity: number;
  processing_date: string;
  notes: string;
}

interface Product {
  id: number;
  name: string;
  unit: string;
  price: number;
  description: string;
}

interface FormData {
  collection_id: string;
  product_id: string;
  input_quantity: string;
  output_quantity: string;
  processing_date: string;
  notes: string;
}

interface ProductForm {
  name: string;
  unit: string;
  price: string;
  description: string;
}

const INITIAL_FORM: FormData = {
  collection_id: '',
  product_id: '',
  input_quantity: '',
  output_quantity: '',
  processing_date: new Date().toISOString().split('T')[0],
  notes: '',
};

const INITIAL_PRODUCT: ProductForm = {
  name: '',
  unit: 'liter',
  price: '',
  description: '',
};

export default function MilkProcessing() {
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [productForm, setProductForm] = useState<ProductForm>(INITIAL_PRODUCT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data: processingData, isLoading } = useQuery({
    queryKey: ['milk-processing'],
    queryFn: async () => {
      const res = await milkAPI.getProcessing({});
      return res.data.data || [];
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['milk-products'],
    queryFn: async () => {
      const res = await milkAPI.getProducts({});
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => milkAPI.createProcessing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-processing'] });
      closeModal();
      toast.success('Processing record created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => milkAPI.updateProcessing(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-processing'] });
      closeModal();
      toast.success('Processing record updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => milkAPI.deleteProcessing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-processing'] });
      toast.success('Processing record deleted');
    },
    onError: () => toast.error('Failed to delete processing record'),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => milkAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      closeProductModal();
      toast.success('Product created');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: any) => milkAPI.updateProduct(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      closeProductModal();
      toast.success('Product updated');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => milkAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const openEdit = (item: ProcessingRecord) => {
    setForm({
      collection_id: String(item.collection_id),
      product_id: '',
      input_quantity: String(item.input_quantity),
      output_quantity: String(item.output_quantity),
      processing_date: item.processing_date,
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProductId(null);
    setProductForm(INITIAL_PRODUCT);
  };

  const openEditProduct = (item: Product) => {
    setProductForm({
      name: item.name,
      unit: item.unit,
      price: String(item.price),
      description: item.description || '',
    });
    setEditingProductId(item.id);
    setShowProductModal(true);
  };

  const processing: ProcessingRecord[] = processingData || [];
  const products: Product[] = productsData || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      collection_id: parseInt(form.collection_id) || undefined,
      product_id: parseInt(form.product_id) || undefined,
      input_quantity: parseFloat(form.input_quantity) || 0,
      output_quantity: parseFloat(form.output_quantity) || 0,
      processing_date: form.processing_date,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: productForm.name,
      unit: productForm.unit,
      price: parseFloat(productForm.price) || 0,
      description: productForm.description || undefined,
    };
    if (editingProductId) {
      updateProductMutation.mutate({ id: editingProductId, ...payload });
    } else {
      createProductMutation.mutate(payload);
    }
  };

  const columns: Column<ProcessingRecord>[] = [
    { key: 'processing_date', label: 'Date' },
    { key: 'input_quantity', label: 'Input (L)', render: (r) => `${r.input_quantity} L` },
    { key: 'product_name', label: 'Product' },
    { key: 'output_quantity', label: 'Output', render: (r) => `${r.output_quantity}` },
    { key: 'notes', label: 'Notes', render: (r) => r.notes || '-' },
    {
      key: 'actions', label: 'Actions', render: (r) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(r); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this processing record?')) deleteMutation.mutate(r.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }} disabled={deleteMutation.isPending}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Milk Processing"
      subtitle="Processing records & product management"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setEditingProductId(null); setProductForm(INITIAL_PRODUCT); setShowProductModal(true); }}>
            <Package size={16} /> New Product
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setShowModal(true); }}>
            <Plus size={16} /> New Processing
          </button>
        </div>
      }
    >
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Processing Records</h3>
        <DataTable columns={columns} data={processing} loading={isLoading} />
      </div>

      <div className="card" style={{ marginTop: 20, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Products</h3>
        {products.length === 0 ? (
          <p className="text-secondary" style={{ textAlign: 'center', padding: 24 }}>No products yet. Create one to get started.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {products.map((p) => (
              <div key={p.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, position: 'relative' }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.unit}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 8 }}>RWF {Number(p.price).toLocaleString()}</div>
                {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                  <button className="btn btn-sm" onClick={() => openEditProduct(p)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 8px' }}><Edit2 size={14} /></button>
                  <button className="btn btn-sm" onClick={async () => { if (await confirm('Delete this product?')) deleteProductMutation.mutate(p.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)', padding: '4px 8px' }} disabled={deleteProductMutation.isPending}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingId ? 'Edit Processing Batch' : 'New Processing Batch'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Collection ID</label>
                <input type="number" className="form-input" value={form.collection_id} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Product</label>
                <select className="form-select" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Input Quantity (L)</label>
                  <input type="number" step="0.01" className="form-input" value={form.input_quantity} onChange={(e) => setForm({ ...form, input_quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Output Quantity</label>
                  <input type="number" step="0.01" className="form-input" value={form.output_quantity} onChange={(e) => setForm({ ...form, output_quantity: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Processing Date</label>
                <input type="date" className="form-input" value={form.processing_date} onChange={(e) => setForm({ ...form, processing_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Processing' : 'Save Processing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingProductId ? 'Edit Product' : 'New Product'}</h2>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}>
                  <option value="liter">Liter</option>
                  <option value="kg">Kilogram</option>
                  <option value="piece">Piece</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input type="number" step="0.01" className="form-input" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeProductModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
