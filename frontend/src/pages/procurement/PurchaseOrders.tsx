import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import toast from 'react-hot-toast';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

const STATUSES = ['All', 'Draft', 'Sent', 'Confirmed', 'Received', 'Cancelled'];

interface OrderForm {
  supplier_id: string; order_date: string; cost: string;
  expected_delivery: string; status: string; notes: string;
}

const initialForm: OrderForm = {
  supplier_id: '', order_date: '', cost: '', expected_delivery: '',
  status: 'draft', notes: '',
};

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<OrderForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['procurement-orders'],
    queryFn: () => client.get('/procurement/orders').then(r => r.data.data || r.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['procurement-suppliers'],
    queryFn: () => client.get('/procurement/suppliers').then(r => r.data.data || []),
  });

  const statusMap: Record<string, string> = { All: '', Draft: 'draft', Sent: 'sent', Confirmed: 'confirmed', Received: 'received', Cancelled: 'cancelled' };
  const filtered = (orders || []).filter((o: any) => !statusMap[activeTab] || o.status === statusMap[activeTab]);

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/procurement/orders', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-orders'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); closeModal(); toast.success('Purchase Order created successfully', { duration: 5000 }); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to create order' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/procurement/orders/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-orders'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); closeModal(); toast.success('Order updated'); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to update order' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/procurement/orders/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-orders'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); toast.success('Order deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.supplier_id) { setErrors({ supplier_id: 'Supplier is required' }); return; }
    if (!form.cost || Number(form.cost) <= 0) { setErrors({ cost: 'Cost is required and must be greater than 0' }); return; }
    const payload = {
      supplier_id: Number(form.supplier_id),
      cost: Number(form.cost),
      order_date: form.order_date || undefined,
      expected_delivery: form.expected_delivery || undefined,
      status: form.status,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (item: any) => {
    setForm({
      supplier_id: String(item.supplier_id || ''),
      cost: item.total_cost != null ? String(item.total_cost) : '',
      order_date: item.order_date ? item.order_date.substring(0, 10) : '',
      expected_delivery: item.expected_delivery ? item.expected_delivery.substring(0, 10) : '',
      status: item.status || 'draft',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const columns: Column<any>[] = [
    { key: 'po_number', label: 'PO #' },
    { key: 'item_name', label: 'Name', render: (o: any) => o.item_name || o.request_items || '-' },
    { key: 'total_cost', label: 'Cost', render: (o: any) => `RWF ${Number(o.total_cost || o.total_amount || 0).toLocaleString()}` },
    { key: 'department', label: 'Department', render: (o: any) => o.department || '-' },
    { key: 'payment_method', label: 'Payment Method', render: (o: any) => o.payment_method || '-' },
    { key: 'status', label: 'Status', render: (o: any) => <StatusBadge status={o.status || 'pending'} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions', render: (o: any) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEdit(o); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={async e => { e.stopPropagation(); if (await confirm('Delete this order?')) deleteMutation.mutate(o.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }} disabled={deleteMutation.isPending}><Trash2 size={14} />{deleteMutation.isPending && ' Deleting...'}</button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Purchase Orders"
      subtitle="Manage purchase orders"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> New PO
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        {STATUSES.map(s => (
          <button key={s} className={`btn btn-sm ${activeTab === s ? 'btn-primary' : ''}`}
            style={activeTab === s ? {} : { background: 'none', border: 'none', color: 'var(--text-secondary)' }}
            onClick={() => setActiveTab(s)}>{s}</button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No purchase orders found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 560, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Order' : 'New Order'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Supplier" required>
                  <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
                    <option value="">Select supplier</option>
                    {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.supplier_name || s.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Cost" required error={errors.cost}>
                  <input type="number" name="cost" value={form.cost} onChange={handleChange} min={0} step="0.01" required placeholder="0.00" />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Order Date">
                  <input type="date" name="order_date" value={form.order_date} onChange={handleChange} />
                </FormField>
                <FormField label="Expected Delivery">
                  <input type="date" name="expected_delivery" value={form.expected_delivery} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Status">
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
