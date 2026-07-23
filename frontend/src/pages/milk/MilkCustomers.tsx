import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Edit2, Trash2 } from 'lucide-react';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { salesAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';

interface Customer {
  id: number;
  name: string;
  phone: string;
  customer_type: string;
  balance: number;
  status: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  customer_type: string;
  address: string;
  initial_payment: string;
}

const INITIAL_FORM: FormData = {
  name: '',
  phone: '',
  email: '',
  customer_type: 'individual',
  address: '',
  initial_payment: '',
};

export default function MilkCustomers() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sales-customers'],
    queryFn: async () => {
      const res = await salesAPI.getCustomers({});
      return res.data.data || [];
    },
  });

  const customers: Customer[] = data || [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
    queryClient.invalidateQueries({ queryKey: ['milk-dashboard-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => salesAPI.createCustomer(data),
    onSuccess: () => { invalidateAll(); closeModal(); },
    onError: () => toast.error('Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => salesAPI.updateCustomer(data.id, data),
    onSuccess: () => { invalidateAll(); closeModal(); toast.success('Customer updated'); },
    onError: () => toast.error('Failed to update customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesAPI.deleteCustomer(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-customers'] }); toast.success('Customer deleted'); },
    onError: () => toast.error('Failed to delete customer'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(INITIAL_FORM); };

  const openEdit = (c: any) => {
    setForm({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      customer_type: c.customer_type || 'individual',
      address: c.address || '',
      initial_payment: '',
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initialPayment = form.initial_payment ? Number(form.initial_payment) : undefined;
    const payload: any = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      customer_type: form.customer_type,
      address: form.address || undefined,
    };
    if (editingId) {
      if (initialPayment !== undefined) payload.balance = initialPayment;
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      if (initialPayment !== undefined) payload.initial_payment = initialPayment;
      createMutation.mutate(payload);
    }
  };

  const columns: Column<Customer>[] = [
    { key: 'name', label: 'Customer Name', render: (c) => c.name || '-' },
    { key: 'phone', label: 'Phone', render: (c) => c.phone || '-' },
    {
      key: 'customer_type', label: 'Type',
      render: (c) => c.customer_type ? <StatusBadge status={c.customer_type} /> : '-',
    },
    { key: 'balance', label: 'Balance', render: (c) => `$${(Number(c.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    {
      key: 'status', label: 'Status',
      render: (c) => c.status ? <StatusBadge status={c.status} /> : '-',
    },
    { key: 'actions', label: 'Actions', render: (c) => (
      <div className="actions">
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(c); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this customer?')) deleteMutation.mutate(c.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <ModulePage
      title="Milk Customers"
      subtitle="Manage milk customers"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setShowModal(true); }}>
          <Plus size={16} /> New Customer
        </button>
      }
    >
      {customers.length === 0 && !isLoading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontWeight: 500 }}>No customers yet</p>
          <p style={{ fontSize: '0.9rem' }}>Add customers to start tracking milk sales.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={customers} loading={isLoading} />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px' }}>{editingId ? 'Edit Customer' : 'New Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Customer Type</label>
                <select className="form-select" value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{editingId ? 'Balance' : 'Initial Payment'}</label>
                <input type="number" min="0" step="0.01" className="form-input" placeholder="0.00" value={form.initial_payment} onChange={(e) => setForm({ ...form, initial_payment: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
