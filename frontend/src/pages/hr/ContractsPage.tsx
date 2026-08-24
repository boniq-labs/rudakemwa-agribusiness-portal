import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { contractsAPI, usersAPI } from '../../api/endpoints';
import { Plus, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

const CONTRACT_TYPES = ['Permanent', 'Temporary', 'Fixed-term', 'Probation'];

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ user_id: '', type: '', start_date: '', end_date: '' });
  const confirm = useConfirm();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsAPI.getAll().then(r => r.data.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['contracts', 'expiring'],
    queryFn: () => contractsAPI.getExpiring().then(r => r.data.data),
  });

  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editing
      ? contractsAPI.update(editing.id, data)
      : contractsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'expiring'] });
      toast.success(editing ? 'Contract updated' : 'Contract created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: number) => contractsAPI.terminate(id, { terminated_at: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'expiring'] });
      toast.success('Contract terminated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Termination failed'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ user_id: '', type: '', start_date: '', end_date: '' });
  };

  const openEdit = (contract: any) => {
    setEditing(contract);
    setForm({
      user_id: contract.user_id?.toString() || '',
      type: contract.type || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      user_id: Number(form.user_id),
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
    });
  };

  const columns: Column<any>[] = [
    {
      key: 'employee', label: 'Employee',
      render: (c: any) => c.user_name || c.employee_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '-',
    },
    { key: 'type', label: 'Type' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date', render: (c: any) => c.end_date || 'Open-ended' },
    { key: 'status', label: 'Status', render: (c: any) => <StatusBadge status={c.status || 'active'} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (c: any) => (
        <div className="actions">
          <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => openEdit(c)}>
            <Edit2 size={14} />
          </button>
          {(c.status === 'active' || !c.status) && (
            <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={async () => { if (await confirm('Terminate this contract?')) terminateMutation.mutate(c.id); }} disabled={terminateMutation.isPending}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const expiringItems = expiring || [];

  return (
    <ModulePage
      title="Contracts"
      subtitle="Manage employee contracts"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Contract
        </button>
      }
    >
      {expiringItems.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, marginBottom: 16, color: '#854d0e' }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.9rem' }}>{expiringItems.length} contract(s) are expiring soon.</span>
        </div>
      )}

      <DataTable columns={columns} data={contracts || []} loading={isLoading} emptyMessage="No contracts found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editing ? 'Edit Contract' : 'New Contract'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Employee" required>
                <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))} required>
                  <option value="">Select employee</option>
                  {(employees || []).filter((u: any) => u.status !== 'terminated').map((u: any) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Contract Type" required>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} required>
                  <option value="">Select type</option>
                  {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <div className="form-row">
                <FormField label="Start Date" required>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
                </FormField>
                <FormField label="End Date">
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </FormField>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
