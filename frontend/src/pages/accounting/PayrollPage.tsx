import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { Trash2, X, DollarSign, Users, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Credit Card', 'Other'];

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', salary: '', date: new Date().toISOString().split('T')[0], phone: '', payment_method: 'Cash', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: payments, isLoading } = useQuery({
    queryKey: ['accounting-salary-payments'],
    queryFn: () => client.get('/accounting/payroll/payments').then(r => r.data.data || r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/accounting/payroll/salary-payment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-salary-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] });
      closeModal();
      toast.success('Salary payment recorded (pending confirmation)');
    },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to record salary payment' });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => client.put(`/accounting/payroll/payments/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-salary-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-expenses'] });
      toast.success('Salary payment confirmed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to confirm'),
  });

const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/accounting/payroll/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-salary-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Salary payment deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const closeModal = () => { setShowModal(false); setForm({ name: '', salary: '', date: new Date().toISOString().split('T')[0], phone: '', payment_method: 'Cash', comment: '' }); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    if (!form.salary || Number(form.salary) <= 0) { setErrors({ salary: 'Valid salary amount is required' }); return; }
    if (!form.date) { setErrors({ date: 'Date is required' }); return; }
    if (!form.phone.trim()) { setErrors({ phone: 'Phone is required' }); return; }
    if (!form.payment_method) { setErrors({ payment_method: 'Payment method is required' }); return; }
    createMutation.mutate({ ...form, salary: Number(form.salary) });
  };

  const paymentList = Array.isArray(payments) ? payments : [];

  const totalConfirmed = useMemo(() => {
    return paymentList.reduce((s: number, p: any) => p.status === 'confirmed' ? s + (Number(p.amount) || 0) : s, 0);
  }, [paymentList]);

  const totalPending = useMemo(() => {
    return paymentList.reduce((s: number, p: any) => p.status === 'pending' ? s + (Number(p.amount) || 0) : s, 0);
  }, [paymentList]);

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name', render: (p: any) => p.vendor || p.name || '-' },
    { key: 'amount', label: 'Salary', render: (p: any) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatAmount(Number(p.amount) || 0)}</span> },
    { key: 'phone', label: 'Phone', render: (p: any) => {
      const notes = p.notes || p.description || '';
      const match = notes.match(/Phone: ([^)]+)/);
      return match ? match[1] : '-';
    }},
    { key: 'payment_method', label: 'Payment Method', render: (p: any) => p.payment_method || '-' },
    { key: 'date', label: 'Date', render: (p: any) => p.date ? new Date(p.date).toLocaleDateString() : '-' },
    {
      key: 'status', label: 'Status',
      render: (p: any) => (
        <span style={{ background: p.status === 'confirmed' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)', color: p.status === 'confirmed' ? '#16a34a' : '#d97706', padding: '3px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>
          {p.status === 'confirmed' ? 'Confirmed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (p: any) => (
        <div className="actions">
          {p.status === 'pending' && (
            <button className="btn btn-sm" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }} disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(p.id)}>
              <CheckCheck size={14} /> Confirm
            </button>
          )}
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} disabled={deleteMutation.isPending} onClick={async () => { if (await confirm('Delete this salary payment?')) deleteMutation.mutate(p.id); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Payroll"
      subtitle="Manage salary payments (confirm to post as expense)"
      actions={
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', salary: '', date: new Date().toISOString().split('T')[0], phone: '', payment_method: 'Cash', comment: '' }); setErrors({}); setShowModal(true); }}>
          <DollarSign size={16} /> Add Salary Payment
        </button>
      }
    >
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatsCard title="Confirmed Payroll" value={formatAmount(totalConfirmed)} icon={DollarSign} color="var(--primary)" />
        <StatsCard title="Pending Confirmation" value={formatAmount(totalPending)} icon={CheckCheck} color="var(--warning)" />
        <StatsCard title="Payments" value={paymentList.length} icon={Users} color="var(--success)" />
      </div>

      <DataTable columns={columns} data={paymentList} loading={isLoading} emptyMessage="No salary payments recorded yet" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Add Salary Payment</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Name" required error={errors.name}>
                <input name="name" className="form-input" value={form.name} onChange={handleChange} required placeholder="Employee name" />
              </FormField>
              <FormField label="Salary" required error={errors.salary}>
                <input name="salary" className="form-input" type="number" step="0.01" value={form.salary} onChange={handleChange} required placeholder="0.00" />
              </FormField>
              <FormField label="Date" required error={errors.date}>
                <input name="date" className="form-input" type="date" value={form.date} onChange={handleChange} required />
              </FormField>
              <FormField label="Phone" required error={errors.phone}>
                <input name="phone" className="form-input" value={form.phone} onChange={handleChange} required placeholder="Phone number" />
              </FormField>
              <FormField label="Payment Method" required error={errors.payment_method}>
                <select name="payment_method" className="form-select" value={form.payment_method} onChange={handleChange} required>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Comment">
                <textarea name="comment" className="form-input" value={form.comment} onChange={handleChange} rows={2} placeholder="Optional note" />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Recording...' : 'Add Salary Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
