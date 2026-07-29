import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { procurementAPI } from '../../api/endpoints';
import { Plus, X, DollarSign, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface InvoiceForm { supplier_id: string; po_id: string; amount: string; due_date: string; }

const initialForm: InvoiceForm = { supplier_id: '', po_id: '', amount: '', due_date: '' };

export default function ProcurementInvoices() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['procurement', 'invoices'],
    queryFn: () => procurementAPI.getInvoices().then(r => r.data.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['procurement', 'suppliers'],
    queryFn: () => procurementAPI.getSuppliers().then(r => r.data.data),
  });

  const { data: orders } = useQuery({
    queryKey: ['procurement', 'orders'],
    queryFn: () => procurementAPI.getOrders().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => procurementAPI.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create invoice' });
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => procurementAPI.payInvoice(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement', 'invoices'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); },
    onError: (err: any) => {
      setErrors({ submit: err.response?.data?.message || 'Failed to record payment' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => procurementAPI.updateInvoice(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      closeModal();
      toast.success('Invoice updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update invoice' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => procurementAPI.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      toast.success('Invoice deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setErrors({});
  };

  const toDateStr = (d: any) => {
    if (!d) return '';
    if (typeof d === 'string') return d.substring(0, 10);
    if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return '';
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      supplier_id: String(item.supplier_id || ''),
      po_id: String(item.po_id || ''),
      amount: String(item.amount || ''),
      due_date: toDateStr(item.due_date),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
      po_id: form.po_id ? Number(form.po_id) : undefined,
      amount: Number(form.amount),
      due_date: form.due_date || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'Invoice #', render: (i: any) => `INV-${String(i.id).padStart(4, '0')}` },
    {
      key: 'supplier', label: 'Supplier',
      render: (i: any) => typeof i.supplier === 'object' ? i.supplier?.company_name || i.supplier?.name || '-' : i.supplier || '-',
    },
    {
      key: 'po_id', label: 'PO #',
      render: (i: any) => i.po_id ? `PO-${String(i.po_id).padStart(4, '0')}` : '-',
    },
    {
      key: 'amount', label: 'Amount',
      render: (i: any) => `$${(i.amount || 0).toLocaleString()}`,
    },
    {
      key: 'due_date', label: 'Due Date',
      render: (i: any) => i.due_date ? new Date(i.due_date).toLocaleDateString() : '-',
    },
    { key: 'status', label: 'Status', render: (i: any) => <StatusBadge status={i.status || 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (i: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(i); }}>
            <Edit2 size={14} />
          </button>
          {(i.status === 'pending' || i.status === 'overdue') && (
            <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }}
              onClick={e => { e.stopPropagation(); payMutation.mutate(i.id); }} disabled={payMutation.isPending}>
              <DollarSign size={14} />
            </button>
          )}
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={async e => { e.stopPropagation(); if (await confirm('Delete this invoice?')) deleteMutation.mutate(i.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} />{deleteMutation.isPending && ' Deleting...'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Procurement Invoices"
      subtitle="Manage supplier invoices and payments"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> New Invoice
        </button>
      }
    >
      <DataTable columns={columns} data={invoices || []} loading={isLoading} emptyMessage="No invoices found" />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Supplier" required>
                  <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
                    <option value="">Select supplier</option>
                    {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.company_name || s.supplier_name}</option>)}
                  </select>
                </FormField>
                <FormField label="Purchase Order">
                  <select name="po_id" value={form.po_id} onChange={handleChange}>
                    <option value="">Select PO</option>
                    {(orders || []).map((o: any) => (
                      <option key={o.id} value={o.id}>PO-{String(o.id).padStart(4, '0')}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Amount" required>
                  <input type="number" name="amount" min={0} step="0.01" value={form.amount} onChange={handleChange} required />
                </FormField>
              </div>
              <FormField label="Due Date">
                <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
