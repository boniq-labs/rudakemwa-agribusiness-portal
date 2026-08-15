import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { Plus, Edit2, Trash2, X, Receipt, TrendingDown, Calendar, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

const CATEGORIES = ['Feed', 'Veterinary', 'Utilities', 'Salaries', 'Transport', 'Maintenance', 'Supplies', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Credit Card', 'Other'];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '', payment_method: 'Cash', vendor: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['accounting-expenses', dateFrom, dateTo],
    queryFn: () => client.get('/accounting/expenses', { params: { start_date: dateFrom, end_date: dateTo } }).then(r => r.data.data || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? client.put(`/accounting/expenses/${editing.id}`, data)
      : client.post('/accounting/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      closeModal();
      toast.success(editing ? 'Expense updated' : 'Expense recorded');
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Operation failed' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/accounting/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Expense deleted');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => client.put(`/accounting/expenses/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Expense confirmed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to confirm'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '', payment_method: 'Cash', vendor: '', notes: '' });
    setErrors({});
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '', payment_method: 'Cash', vendor: '', notes: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      amount: String(item.amount || ''),
      category: item.category || '',
      date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
      description: item.description || '',
      payment_method: item.payment_method || 'Cash',
      vendor: item.vendor || '',
      notes: item.notes || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setErrors({ amount: 'Valid amount is required' }); return; }
    if (!form.category.trim()) { setErrors({ category: 'Category is required' }); return; }
    saveMutation.mutate({ ...form, amount: Number(form.amount) });
  };

  const totalExpenses = useMemo(() => {
    if (!expenses) return 0;
    return (Array.isArray(expenses) ? expenses : []).reduce((s: number, e: any) => e.status === 'confirmed' ? s + (Number(e.amount) || 0) : s, 0);
  }, [expenses]);

  const pendingExpenses = useMemo(() => {
    if (!expenses) return 0;
    return (Array.isArray(expenses) ? expenses : []).reduce((s: number, e: any) => e.status === 'pending' ? s + (Number(e.amount) || 0) : s, 0);
  }, [expenses]);

  const expenseList = Array.isArray(expenses) ? expenses : [];

  const columns: Column<any>[] = [
    { key: 'category', label: 'Category', render: (e: any) => e.category || '-' },
    { key: 'description', label: 'Description', render: (e: any) => e.description || '-' },
    { key: 'amount', label: 'Amount', render: (e: any) => <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatAmount(Number(e.amount) || 0)}</span> },
    { key: 'payment_method', label: 'Payment', render: (e: any) => e.payment_method || '-' },
    { key: 'vendor', label: 'Vendor', render: (e: any) => e.vendor || '-' },
    { key: 'date', label: 'Date', render: (e: any) => e.date ? new Date(e.date).toLocaleDateString() : '-' },
    {
      key: 'status', label: 'Status',
      render: (e: any) => (
        <span style={{ background: e.status === 'confirmed' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)', color: e.status === 'confirmed' ? '#16a34a' : '#d97706', padding: '3px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
          {e.status === 'confirmed' ? 'Confirmed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (e: any) => (
        <div className="actions">
          {e.status === 'pending' && (
            <button className="btn btn-sm" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }} disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(e.id)}>
              <CheckCheck size={14} /> Confirm
            </button>
          )}
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(e)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={async () => { if (await confirm('Delete this expense?')) deleteMutation.mutate(e.id); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Expenses"
      subtitle="Record and manage expenses"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Expense
        </button>
      }
    >
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatsCard title="Confirmed Expenses" value={formatAmount(totalExpenses)} icon={TrendingDown} color="var(--danger)" />
        <StatsCard title="Pending Confirmation" value={formatAmount(pendingExpenses)} icon={CheckCheck} color="var(--warning)" />
        <StatsCard title="Transactions" value={expenseList.length} icon={Receipt} color="var(--warning)" />
        <StatsCard title="Period" value={`${dateFrom} to ${dateTo}`} icon={Calendar} color="var(--info)" />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={expenseList} loading={isLoading} emptyMessage="No expense records found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                <FormField label="Amount" required error={errors.amount}>
                  <input name="amount" className="form-input" value={form.amount} onChange={handleChange} placeholder="0.00" type="number" step="0.01" />
                </FormField>
                <FormField label="Category" required error={errors.category}>
                  <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Date" required>
                  <input name="date" className="form-input" value={form.date} onChange={handleChange} type="date" />
                </FormField>
                <FormField label="Description">
                  <textarea name="description" className="form-input" value={form.description} onChange={handleChange} rows={2} />
                </FormField>
                <FormField label="Payment Method">
                  <select name="payment_method" className="form-select" value={form.payment_method} onChange={handleChange}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
                <FormField label="Vendor">
                  <input name="vendor" className="form-input" value={form.vendor} onChange={handleChange} placeholder="Vendor name" />
                </FormField>
                <FormField label="Notes">
                  <textarea name="notes" className="form-input" value={form.notes} onChange={handleChange} rows={3} />
                </FormField>
                {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
