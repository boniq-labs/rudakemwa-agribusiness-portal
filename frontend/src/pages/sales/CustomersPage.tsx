import { useState, type FormEvent } from 'react';
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

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Credit Card', 'Other'];

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  type: string;
  product_id: string;
  quantity: string;
  payment_method: string;
}

const initialForm: CustomerForm = { name: '', phone: '', email: '', address: '', type: 'regular', product_id: '', quantity: '', payment_method: 'Cash' };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showOtherSale, setShowOtherSale] = useState(false);
  const [otherForm, setOtherForm] = useState({ name: '', other_product: '', phone: '', cost: '', payment_method: 'Cash' });
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const confirm = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ['sales-customers'],
    queryFn: () => client.get('/sales/customers').then(r => r.data.data || []),
  });

  const { data: products } = useQuery({
    queryKey: ['sales-products'],
    queryFn: () => client.get('/sales/products').then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/customers', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-income'] });
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
  const productList = Array.isArray(products) ? products : [];
  const filtered = list.filter((c: any) =>
    `${c.name || ''} ${c.phone || ''} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = productList.find((p: any) => String(p.id) === form.product_id);
  const availableStock = selectedProduct ? Number(selectedProduct.quantity_available) || 0 : 0;
  const unitPrice = selectedProduct ? Number(selectedProduct.price) || 0 : 0;
  const quantityNum = Number(form.quantity);
  const isQuantityValid = !isNaN(quantityNum) && quantityNum > 0 && quantityNum <= availableStock;
  const totalAmount = selectedProduct && isQuantityValid ? Number((quantityNum * unitPrice).toFixed(2)) : 0;
  const saleValid = !editId && form.product_id !== '' && isQuantityValid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editId) {
      // Edit only updates customer profile info; it must NOT create a sale/payment/stock/income.
      const payload: any = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        type: form.type,
      };
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      if (!saleValid) return;
      const payload: any = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        type: form.type,
        product_id: Number(form.product_id),
        quantity: quantityNum,
        payment_method: form.payment_method,
      };
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (c: any) => {
    setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '', type: c.type || 'regular', product_id: '', quantity: '', payment_method: 'Cash' });
    setEditId(c.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this customer?')) deleteMutation.mutate(id);
  };

  /* Other Sale: free-text farm product (eggs, chicken, manure, ...) —
     reuses the existing Customer → Payment → pending Income flow. */
  const otherSaleMutation = useMutation({
    mutationFn: (d: any) => client.post('/sales/customers', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-customers'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-income'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      toast.success('Other sale recorded — pending in Accounting → Income for confirmation');
      setShowOtherSale(false);
      setOtherForm({ name: '', other_product: '', phone: '', cost: '', payment_method: 'Cash' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record other sale'),
  });

  const handleOtherSaleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cost = Number(otherForm.cost);
    if (!otherForm.name.trim() || !otherForm.other_product.trim() || !Number.isFinite(cost) || cost <= 0) return;
    otherSaleMutation.mutate({
      name: otherForm.name,
      phone: otherForm.phone,
      other_product: otherForm.other_product.trim(),
      cost,
      payment_method: otherForm.payment_method,
    });
  };

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone', render: (c: any) => c.phone || '-' },
    { key: 'email', label: 'Email', render: (c: any) => c.email || '-' },
    { key: 'type', label: 'Type', render: (c: any) => c.type || 'regular' },
    { key: 'total_purchase_amount', label: 'Total Purchase', render: (c: any) => `RWF ${Number(c.total_purchase_amount || 0).toLocaleString()}` },
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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setForm(initialForm); setEditId(null); setShowModal(true); }}>
            <Plus size={16} /> Add Customer
          </button>
          <button className="btn" onClick={() => setShowOtherSale(true)}>
            <Plus size={16} /> Other Sales
          </button>
        </div>
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
          {!editId && (
            <>
              <FormField label="Product" required>
                <select className="form-input" value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value, quantity: '' }))}>
                  <option value="">Select product</option>
                  {productList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - RWF {Number(p.price).toLocaleString()}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Available Stock">
                <input className="form-input" value={selectedProduct ? String(availableStock) : '-'} readOnly />
              </FormField>
              <FormField label="Quantity" required error={form.quantity !== '' && (quantityNum <= 0 || quantityNum > availableStock) ? (quantityNum > availableStock ? `Quantity cannot exceed available stock (${availableStock})` : 'Quantity must be greater than 0') : undefined}>
                <input className="form-input" type="number" step="0.01" min="0" max={availableStock || undefined} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} disabled={!selectedProduct} placeholder="0" />
              </FormField>
              <FormField label="Unit Price">
                <input className="form-input" type="number" step="0.01" value={selectedProduct ? String(unitPrice) : '0.00'} readOnly />
              </FormField>
              <FormField label="Total Amount">
                <input className="form-input" type="number" step="0.01" value={String(totalAmount)} readOnly />
              </FormField>
              <FormField label="Payment Method">
                <select className="form-input" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
            </>
          )}
          {editId && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>
              Editing customer profile only. Use &quot;Sales Orders&quot; to record a new sale.
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending || (!editId && !saleValid)}>
              {editId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showOtherSale} onClose={() => setShowOtherSale(false)} title="Other Sale">
        <form onSubmit={handleOtherSaleSubmit}>
          <FormField label="Customer Name" required>
            <input className="form-input" value={otherForm.name} onChange={e => setOtherForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Jean Mukamana" required />
          </FormField>
          <FormField label="Other Product" required>
            {/* Free-text farm product — intentionally NOT the Product Management selector */}
            <input className="form-input" value={otherForm.other_product} onChange={e => setOtherForm(p => ({ ...p, other_product: e.target.value }))} placeholder="Eggs, Chicken, Manure, Piglet, Feed…" required />
          </FormField>
          <FormField label="Phone" required>
            <input className="form-input" value={otherForm.phone} onChange={e => setOtherForm(p => ({ ...p, phone: e.target.value }))} required />
          </FormField>
          <FormField label="Cost (RWF)" required>
            <input className="form-input" type="number" step="0.01" min="0" value={otherForm.cost} onChange={e => setOtherForm(p => ({ ...p, cost: e.target.value }))} required />
          </FormField>
          <FormField label="Payment Method">
            <select className="form-input" value={otherForm.payment_method} onChange={e => setOtherForm(p => ({ ...p, payment_method: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 8 }}>
            Goes to Accounting → Income as pending for Accountant confirmation.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn" onClick={() => setShowOtherSale(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={otherSaleMutation.isPending}>
              {otherSaleMutation.isPending ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </ModulePage>
  );
}
