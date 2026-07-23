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

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  type: string;
}

const initialForm: CustomerForm = { name: '', phone: '', email: '', address: '', type: 'regular' };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-customers'],
    queryFn: () => client.get('/sales/customers').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/customers', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Customer created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/sales/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Customer updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/sales/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Customer deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter((c: any) =>
    `${c.name || ''} ${c.phone || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (c: any) => {
    setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '', type: c.type || 'regular' });
    setEditId(c.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this customer?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', render: (c: any) => c.phone || '-' },
    { key: 'email', label: 'Email', render: (c: any) => c.email || '-' },
    { key: 'type', label: 'Type', render: (c: any) => c.type || 'regular' },
    {
      key: 'actions', label: 'Actions',
      render: (c: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => handleEdit(c)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Customers"
      subtitle="Manage sales customers"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> Add Customer
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No customers found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Name" required>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </FormField>
          <FormField label="Phone" required>
            <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
          </FormField>
          <FormField label="Email">
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </FormField>
          <FormField label="Address">
            <textarea className="form-input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} />
          </FormField>
          <FormField label="Type">
            <select className="form-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="regular">Regular</option>
              <option value="wholesale">Wholesale</option>
              <option value="retail">Retail</option>
              <option value="vip">VIP</option>
            </select>
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
