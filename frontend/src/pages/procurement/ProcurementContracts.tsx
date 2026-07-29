import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { Plus, X, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { procurementAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';
import { useConfirm } from '../../components/ConfirmDialog';

interface ContractForm { contract_number: string; supplier_id: string; start_date: string; end_date: string; terms: string; total_value: string; }

const initialForm: ContractForm = { contract_number: '', supplier_id: '', start_date: '', end_date: '', terms: '', total_value: '' };

export default function ProcurementContracts() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContractForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['procurement', 'contracts'],
    queryFn: () => procurementAPI.getContracts().then(r => r.data.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['procurement', 'contracts', 'expiring'],
    queryFn: () => procurementAPI.getExpiringContracts().then(r => r.data.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['procurement', 'suppliers'],
    queryFn: () => procurementAPI.getSuppliers().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => procurementAPI.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create contract' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => procurementAPI.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      closeModal();
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update contract' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => procurementAPI.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] });
      toast.success('Contract deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete contract');
    },
  });

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

  const openEdit = (contract: any) => {
    setEditingId(contract.id);
    setForm({
      contract_number: contract.contract_number || '',
      supplier_id: String(typeof contract.supplier === 'object' ? contract.supplier?.id : contract.supplier_id || ''),
      start_date: toDateStr(contract.start_date),
      end_date: toDateStr(contract.end_date),
      terms: contract.terms || '',
      total_value: String(contract.total_value || ''),
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
      total_value: Number(form.total_value),
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const expiringList = Array.isArray(expiring) ? expiring : [];

  const columns: Column<any>[] = [
    { key: 'contract_number', label: 'Contract #' },
    {
      key: 'supplier', label: 'Supplier',
      render: (c: any) => typeof c.supplier === 'object' ? c.supplier?.company_name || c.supplier?.name || '-' : c.supplier || '-',
    },
    {
      key: 'start_date', label: 'Start Date',
      render: (c: any) => c.start_date ? new Date(c.start_date).toLocaleDateString() : '-',
    },
    {
      key: 'end_date', label: 'End Date',
      render: (c: any) => {
        const end = c.end_date ? new Date(c.end_date) : null;
        if (!end) return '-';
        const isExpiring = end <= new Date(Date.now() + 30 * 86400000) && end >= new Date();
        return <span style={isExpiring ? { color: '#d97706', fontWeight: 600 } : undefined}>{end.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'total_value', label: 'Total Value',
      render: (c: any) => `$${(c.total_value || 0).toLocaleString()}`,
    },
    { key: 'status', label: 'Status', render: (c: any) => <StatusBadge status={c.status || 'active'} /> },
    {
      key: 'actions', label: '',
      render: (c: any) => (
        <div className="actions">
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
            <Edit2 size={14} /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this contract?')) deleteMutation.mutate(c.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Contracts"
      subtitle="Manage supplier contracts"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Contract
        </button>
      }
    >
      {expiringList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fef9c3', borderRadius: 8, marginBottom: 16, color: '#854d0e' }}>
          <AlertTriangle size={20} />
          <span style={{ fontWeight: 600 }}>{expiringList.length} contract{expiringList.length > 1 ? 's' : ''} expiring within 30 days</span>
        </div>
      )}

      <DataTable columns={columns} data={contracts || []} loading={isLoading} emptyMessage="No contracts found" />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Contract' : 'New Contract'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Contract Number" required>
                  <input name="contract_number" value={form.contract_number} onChange={handleChange} required />
                </FormField>
                <FormField label="Supplier" required>
                  <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
                    <option value="">Select supplier</option>
                    {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.company_name || s.supplier_name}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Start Date" required>
                  <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
                </FormField>
                <FormField label="End Date" required>
                  <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
                </FormField>
              </div>
              <FormField label="Terms & Conditions">
                <textarea name="terms" value={form.terms} onChange={handleChange} rows={3} />
              </FormField>
              <FormField label="Total Value" required>
                <input type="number" name="total_value" min={0} step="0.01" value={form.total_value} onChange={handleChange} required />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? updateMutation.isPending ? 'Updating...' : 'Update Contract' : createMutation.isPending ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
