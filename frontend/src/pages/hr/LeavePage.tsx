import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { leaveAPI } from '../../api/endpoints';
import { Plus, Check, X, XCircle, Trash2 } from 'lucide-react';
import type { Column } from '../../components/DataTable';

type Tab = 'my-requests' | 'pending-approvals' | 'leave-types';

export default function LeavePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('my-requests');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leave_type_id: '', start_date: '', end_date: '', reason: '' });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => leaveAPI.getRequests().then(r => r.data.data),
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ['leave-requests', 'pending'],
    queryFn: () => leaveAPI.getRequests({ status: 'pending' }).then(r => r.data.data),
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveAPI.getTypes().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => leaveAPI.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setShowModal(false);
      setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => leaveAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => leaveAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => leaveAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      leave_type_id: Number(form.leave_type_id),
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason,
    });
  };

  const requestColumns: Column<any>[] = [
    { key: 'user_name', label: 'Employee', render: (r: any) => r.user_name || '-' },
    { key: 'leave_type', label: 'Leave Type', render: (r: any) => typeof r.leave_type === 'object' ? r.leave_type?.name : r.leave_type_name || r.leave_type || '-' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (r: any) => r.status === 'pending' ? (
        <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={() => cancelMutation.mutate(r.id)} disabled={cancelMutation.isPending}>
          <Trash2 size={14} /> Cancel
        </button>
      ) : null,
    },
  ];

  const pendingColumns: Column<any>[] = [
    ...requestColumns,
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="actions">
          <button className="btn btn-sm btn-primary" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}>
            <Check size={14} /> Approve
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => rejectMutation.mutate(r.id)} disabled={rejectMutation.isPending}>
            <X size={14} /> Reject
          </button>
        </div>
      ),
    },
  ];

  const typeColumns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'days_allowed', label: 'Days Allowed', render: (t: any) => t.days_allowed ?? '-' },
    { key: 'description', label: 'Description', render: (t: any) => t.description || '-' },
  ];

  return (
    <ModulePage
      title="Leave Management"
      subtitle="Manage leave requests and types"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Request
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {(['my-requests', 'pending-approvals', 'leave-types'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.2s',
            }}
          >
            {tab === 'my-requests' ? 'My Requests' : tab === 'pending-approvals' ? 'Pending Approvals' : 'Leave Types'}
          </button>
        ))}
      </div>

      {activeTab === 'my-requests' && (
        <DataTable columns={requestColumns} data={requests || []} loading={requestsLoading} emptyMessage="No leave requests found" />
      )}
      {activeTab === 'pending-approvals' && (
        <DataTable columns={pendingColumns} data={pendingRequests || []} loading={requestsLoading} emptyMessage="No pending approvals" />
      )}
      {activeTab === 'leave-types' && (
        <DataTable columns={typeColumns} data={leaveTypes || []} loading={requestsLoading} emptyMessage="No leave types configured" />
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Leave Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Leave Type" required>
                <select value={form.leave_type_id} onChange={e => setForm(p => ({ ...p, leave_type_id: e.target.value }))} required>
                  <option value="">Select type</option>
                  {(leaveTypes || []).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>
              <div className="form-row">
                <FormField label="Start Date" required>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
                </FormField>
                <FormField label="End Date" required>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required />
                </FormField>
              </div>
              <FormField label="Reason">
                <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3} />
              </FormField>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
