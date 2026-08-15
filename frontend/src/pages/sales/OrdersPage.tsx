import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import type { Column } from '../../components/DataTable';
import { Plus, Search } from 'lucide-react';

interface OrderForm {
  customer_id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  total_amount: string;
  order_date: string;
  status: string;
  notes: string;
}

const initialForm: OrderForm = {
  customer_id: '', product_id: '', quantity: '', unit_price: '',
  total_amount: '', order_date: new Date().toISOString().split('T')[0],
  status: 'pending', notes: '',
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<OrderForm>(initialForm);
  const confirm = useConfirm();

  useEffect(() => {
    if (searchParams.get('add') === 'true' && !editId) {
      setShowModal(true);
    }
  }, [searchParams, editId]);

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => client.get('/sales/orders').then(r => r.data.data || []),
  });

  const { data: customers } = useQuery({
    queryKey: ['sales-customers-select'],
    queryFn: () => client.get('/sales/customers').then(r => r.data.data || []),
  });

  const { data: products } = useQuery({
    queryKey: ['sales-products-select'],
    queryFn: () => client.get('/sales/products').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/orders', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Order created');
      setShowModal(false);
      setForm(initialForm);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => client.put(`/sales/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Order updated');
      setShowModal(false);
      setForm(initialForm);
      setEditId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/sales/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Order deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const list = Array.isArray(data) ? data : [];
  const customerList = Array.isArray(customers) ? customers : [];
  const productList = Array.isArray(products) ? products : [];

  const filtered = list.filter((o: any) =>
    `${o.order_number || ''} ${o.customer_name || ''} ${o.status || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      product_id: form.product_id ? Number(form.product_id) : undefined,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      total_amount: Number(form.total_amount),
    };
    if (editId) updateMutation.mutate({ id: editId, data: payload });
    else createMutation.mutate(payload);
  };

  const handleEdit = (o: any) => {
    const firstItem = Array.isArray(o.items) && o.items.length > 0 ? o.items[0] : null;
    setForm({
      customer_id: String(o.customer_id || ''),
      product_id: firstItem ? String(firstItem.product_id || '') : '',
      quantity: firstItem ? String(firstItem.quantity || '') : '',
      unit_price: firstItem ? String(firstItem.unit_price || '') : '',
      total_amount: String(o.total_amount || ''),
      order_date: o.order_date ? o.order_date.split('T')[0] : '',
      status: o.status || 'pending',
      notes: o.notes || '',
    });
    setEditId(o.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this order?')) deleteMutation.mutate(id);
  };

  const columns: Column<any>[] = [
    { key: 'order_number', label: 'Order', render: (o: any) => o.order_number || `#${o.id}` },
    { key: 'customer', label: 'Customer', render: (o: any) => o.customer?.name || o.customer_name || '-' },
    {
      key: 'total_amount', label: 'Total',
      render: (o: any) => `RWF ${Number(o.total_amount || o.amount || 0).toLocaleString()}`,
    },
    {
      key: 'order_date', label: 'Date',
      render: (o: any) => o.order_date ? new Date(o.order_date).toLocaleDateString() : '-',
    },
    { key: 'status', label: 'Status' },
    {
      key: 'actions', label: 'Actions',
      render: (o: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" onClick={() => handleEdit(o)}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)} disabled={deleteMutation.isPending}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Sales Orders"
      subtitle="Manage sales orders"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> New Order
        </button>
      }
    >
      <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
        <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No orders found" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Order' : 'New Order'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Customer" required>
            <select className="form-input" value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))} required>
              <option value="">Select customer</option>
              {customerList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Product">
            <select className="form-input" value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}>
              <option value="">Select product</option>
              {productList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} - RWF {Number(p.price).toLocaleString()}</option>
              ))}
            </select>
          </FormField>
          <div className="form-row">
            <FormField label="Quantity" required>
              <input className="form-input" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
            </FormField>
            <FormField label="Unit Price" required>
              <input className="form-input" type="number" step="0.01" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))} required />
            </FormField>
          </div>
          <FormField label="Total Amount" required>
            <input className="form-input" type="number" step="0.01" value={form.total_amount} onChange={e => setForm(p => ({ ...p, total_amount: e.target.value }))} required />
          </FormField>
          <div className="form-row">
            <FormField label="Order Date" required>
              <input className="form-input" type="date" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} required />
            </FormField>
            <FormField label="Status">
              <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormField>
          </div>
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
