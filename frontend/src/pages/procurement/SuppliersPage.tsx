import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import toast from 'react-hot-toast';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import type { Column } from '../../components/DataTable';

interface SupplierForm {
  supplier_name: string; contact_person: string; phone: string; email: string; address: string; category_id: string;
}

const initialForm: SupplierForm = {
  supplier_name: '', contact_person: '', phone: '', email: '', address: '', category_id: '',
};

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<SupplierForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: () => client.get('/procurement/suppliers').then(r => r.data.data || []),
  });

  const { data: supplierCategories } = useQuery({
    queryKey: ['procurement-supplier-categories'],
    queryFn: () => client.get('/procurement/supplier-categories').then(r => r.data.data || []),
  });

  const filtered = (suppliers || []).filter((s: any) =>
    `${s.supplier_name || s.name || ''} ${s.contact_person || ''} ${s.phone || ''} ${s.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/procurement/suppliers', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-suppliers'] }); closeModal(); toast.success('Supplier created'); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to create supplier' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/procurement/suppliers/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-suppliers'] }); closeModal(); toast.success('Supplier updated'); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to update supplier' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/procurement/suppliers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-suppliers'] }); toast.success('Supplier deleted'); },
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
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (item: any) => {
    setForm({
      supplier_name: item.supplier_name || item.name || '',
      contact_person: item.contact_person || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      category_id: String(item.category_id || ''),
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const columns: Column<any>[] = [
    { key: 'supplier_name', label: 'Supplier Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'category_name', label: 'Category', render: (s: any) => s.category_name || s.category || '-' },
    {
      key: 'actions', label: 'Actions', render: (s: any) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEdit(s); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); if (confirm('Delete this supplier?')) deleteMutation.mutate(s.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Suppliers"
      subtitle="Manage suppliers"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> New Supplier
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No suppliers found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 560, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Supplier Name" required>
                  <input name="supplier_name" value={form.supplier_name} onChange={handleChange} required />
                </FormField>
                <FormField label="Contact Person">
                  <input name="contact_person" value={form.contact_person} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Phone" required>
                  <input name="phone" value={form.phone} onChange={handleChange} required />
                </FormField>
                <FormField label="Email">
                  <input type="email" name="email" value={form.email} onChange={handleChange} />
                </FormField>
              </div>
              <FormField label="Address">
                <textarea name="address" value={form.address} onChange={handleChange} rows={2} />
              </FormField>
              <FormField label="Category">
                <select name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">Select category</option>
                  {(supplierCategories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
