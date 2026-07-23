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

interface InvoiceForm {
  order_id: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: string;
  notes: string;
}

const initialForm: InvoiceForm = {
  order_id: '',
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: '',
  status: 'pending',
  total_amount: '',
  notes: '',
};

export default function SalesInvoices() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceForm>(initialForm);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-invoices'],
    queryFn: () => client.get('/sales/invoices').then(r => r.data.data || []),
  });

  const { data: orders } = useQuery({
    queryKey: ['sales-orders-select'],
    queryFn: () => client.get('/sales/orders').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/invoices', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Invoice created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/sales/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Invoice updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/sales/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Invoice deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const orderList = Array.isArray(orders) ? orders : [];

  const filtered = list.filter((inv: any) =>
    `${inv.invoice_number || ''} ${inv.order_number || ''} ${inv.status || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      order_id: Number(form.order_id),
      total_amount: Number(form.total_amount),
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (inv: any) => {
    setForm({
      order_id: String(inv.order_id || ''),
      invoice_date: inv.invoice_date ? inv.invoice_date.split('T')[0] : '',
      due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
      status: inv.status || 'pending',
      total_amount: String(inv.total_amount || ''),
      notes: inv.notes || '',
    });
    setEditId(inv.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this invoice?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { key: 'invoice_number', label: 'Invoice', render: (inv: any) => inv.invoice_number || `#${inv.id}` },
    {
      key: 'order', label: 'Order',
      render: (inv: any) => inv.order?.order_number || inv.order_number || `Order #${inv.order_id}`,
    },
    {
      key: 'invoice_date', label: 'Date',
      render: (inv: any) => inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '-',
    },
    {
      key: 'due_date', label: 'Due Date',
      render: (inv: any) => inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-',
    },
    {
      key: 'total_amount', label: 'Total',
      render: (inv: any) => `$${Number(inv.total_amount || 0).toFixed(2)}`,
    },
    { key: 'status', label: 'Status' },
    {
      key: 'actions', label: 'Actions',
      render: (inv: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => handleEdit(inv)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(inv.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Sales Invoices"
      subtitle="Manage sales invoices"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> New Invoice
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No invoices found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Invoice' : 'New Invoice'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Order" required>
            <select className="form-input" value={form.order_id} onChange={e => setForm(p => ({ ...p, order_id: e.target.value }))} required>
              <option value="">Select order</option>
              {orderList.map((o: any) => (
                <option key={o.id} value={o.id}>{o.order_number || `Order #${o.id}`} - ${Number(o.total_amount || 0).toFixed(2)}</option>
              ))}
            </select>
          </FormField>
          <div className="form-row">
            <FormField label="Invoice Date" required>
              <input className="form-input" type="date" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} required />
            </FormField>
            <FormField label="Due Date">
              <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Total Amount" required>
            <input className="form-input" type="number" step="0.01" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} required />
          </FormField>
          <FormField label="Status">
            <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
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
