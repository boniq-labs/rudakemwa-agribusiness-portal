import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { accountingAPI } from '../../api/endpoints';
import { formatAmount } from '../../services/currency';
import { Plus, X, DollarSign, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

const STATUS_TABS = ['All', 'Draft', 'Sent', 'Paid', 'Partial', 'Overdue', 'Cancelled'];

export default function AccountingInvoices() {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null);
  const [form, setForm] = useState({
    invoice_number: '', customer_id: '', type: 'income', items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    tax: 0, due_date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['accounting-invoices'],
    queryFn: () => accountingAPI.getInvoices().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingAPI.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to create invoice' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => accountingAPI.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to update invoice' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => accountingAPI.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Invoice deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => accountingAPI.payInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      setShowPaymentModal(null);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ invoice_number: '', customer_id: '', type: 'income', items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }], tax: 0, due_date: '' });
    setErrors({});
  };

  const openEdit = (inv: any) => {
    setEditingId(inv.id);
    setForm({
      invoice_number: inv.invoice_number || '',
      customer_id: String(inv.customer_id || ''),
      type: inv.type || 'income',
      items: (inv.items || []).length > 0 ? inv.items.map((i: any) => ({ description: i.description || '', quantity: i.quantity || 1, unit_price: i.unit_price || 0, total: i.total || 0 })) : [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      tax: inv.tax || 0,
      due_date: inv.due_date ? inv.due_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (i: number, field: string, value: any) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      items[i].total = (Number(items[i].quantity) || 0) * (Number(items[i].unit_price) || 0);
    }
    setForm(prev => ({ ...prev, items }));
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }] }));
  };

  const removeItem = (i: number) => {
    if (form.items.length === 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoice_number.trim()) { setErrors({ invoice_number: 'Invoice number is required' }); return; }
    if (!form.due_date) { setErrors({ due_date: 'Due date is required' }); return; }
    const subtotal = form.items.reduce((s, item) => s + item.total, 0);
    const total = subtotal + Number(form.tax);
    const payload = {
      invoice_number: form.invoice_number,
      customer_id: form.customer_id ? Number(form.customer_id) : undefined,
      type: form.type,
      items: form.items,
      tax: Number(form.tax),
      total_amount: total,
      due_date: form.due_date,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filtered = !invoices ? [] : statusTab === 'All' ? invoices : invoices.filter((inv: any) => inv.status?.toLowerCase() === statusTab.toLowerCase());

  const columns: Column<any>[] = [
    { key: 'invoice_number', label: 'Invoice#' },
    { key: 'customer', label: 'Customer/Supplier', render: (inv: any) => {
      const name = typeof inv.customer === 'object' ? inv.customer?.name || inv.customer?.first_name + ' ' + (inv.customer?.last_name || '') : inv.customer_name;
      return name || '-';
    }},
    { key: 'type', label: 'Type', render: (inv: any) => <span style={{ textTransform: 'capitalize' }}>{inv.type}</span> },
    { key: 'total_amount', label: 'Total Amount', render: (inv: any) => <span style={{ fontWeight: 600 }}>{formatAmount(Number(inv.total_amount) || 0)}</span> },
    { key: 'due_date', label: 'Due Date', render: (inv: any) => inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (inv: any) => <StatusBadge status={inv.status} /> },
    {
      key: 'actions', label: '',
      render: (inv: any) => (
        <div className="actions">
          {(inv.status === 'sent' || inv.status === 'partial') && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowPaymentModal(inv.id)}>
              <DollarSign size={14} /> Record Payment
            </button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openEdit(inv); }}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this invoice?')) deleteMutation.mutate(inv.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Invoices"
      subtitle="Manage accounting invoices"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Invoice
        </button>
      }
    >
      <div className="card" style={{ padding: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${statusTab === tab ? 'btn-primary' : ''}`}
              style={statusTab === tab ? {} : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => setStatusTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        emptyMessage="No invoices found"
      />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Invoice Number *</label>
                  <input name="invoice_number" className="form-input" value={form.invoice_number} onChange={handleChange} placeholder="e.g. INV-001" />
                  {errors.invoice_number && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.invoice_number}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input name="customer_id" className="form-input" value={form.customer_id} onChange={handleChange} type="number" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input name="due_date" className="form-input" value={form.due_date} onChange={handleChange} type="date" />
                  {errors.due_date && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.due_date}</p>}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Items</label>
                  <button type="button" className="btn btn-sm" onClick={addItem}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input className="form-input" placeholder="Description" value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)} style={{ flex: 2 }} />
                    <input className="form-input" type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(i, 'quantity', Number(e.target.value))} style={{ flex: 0.5 }} min={1} />
                    <input className="form-input" type="number" step="0.01" placeholder="Unit Price" value={item.unit_price} onChange={e => handleItemChange(i, 'unit_price', Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={{ fontWeight: 600, minWidth: 80 }}>{formatAmount(item.total)}</span>
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <div style={{ width: 200 }}>
                  <div className="form-group">
                    <label className="form-label">Tax</label>
                    <input name="tax" className="form-input" value={form.tax} onChange={e => setForm(p => ({ ...p, tax: Number(e.target.value) }))} type="number" step="0.01" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid var(--border)' }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700 }}>{formatAmount(form.items.reduce((s, item) => s + item.total, 0) + Number(form.tax))}</span>
                  </div>
                </div>
              </div>

              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? updateMutation.isPending ? 'Updating...' : 'Update Invoice' : createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Record Payment</h2>
              <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <p style={{ marginBottom: 20 }}>Mark this invoice as paid?</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowPaymentModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => payMutation.mutate(showPaymentModal)} disabled={payMutation.isPending}>
                {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
