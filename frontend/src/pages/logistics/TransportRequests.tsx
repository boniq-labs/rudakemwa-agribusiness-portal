import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { logisticsAPI, departmentsAPI } from '../../api/endpoints';
import { Plus, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

const STATUS_TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];
const PRIORITY_COLORS: Record<string, string> = {
  low: '#dbeafe #1e40af',
  normal: '#f3f4f6 #374151',
  high: '#fef9c3 #854d0e',
  urgent: '#fef2f2 #991b1b',
};

interface FormData {
  department_id: string; pickup_location: string; destination: string;
  required_date: string; description: string; priority: string;
}

const initialForm: FormData = {
  department_id: '', pickup_location: '', destination: '',
  required_date: '', description: '', priority: 'normal',
};

export default function TransportRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const confirm = useConfirm();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['logistics', 'requests'],
    queryFn: () => logisticsAPI.getRequests().then(r => r.data.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsAPI.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => logisticsAPI.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      setShowModal(false);
      setForm(initialForm);
      setErrors({});
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create request' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => logisticsAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Transport request approved');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => logisticsAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Transport request rejected');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => logisticsAPI.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Request deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete request');
    },
  });

  const filtered = (requests || []).filter((r: any) =>
    activeTab === 'All' || (r.status || '').toLowerCase() === activeTab.toLowerCase()
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      department_id: form.department_id ? Number(form.department_id) : undefined,
    };
    createMutation.mutate(payload);
  };

  const renderPriority = (priority: string) => {
    const colors = PRIORITY_COLORS[priority?.toLowerCase()] || '#f3f4f6 #374151';
    const [bg, text] = colors.split(' ');
    return <span className="badge" style={{ background: bg, color: text }}>{priority}</span>;
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'Request #', render: (r: any) => `#${r.id}` },
    {
      key: 'department_name', label: 'Department',
      render: (r: any) => r.department_name || '-',
    },
    {
      key: 'route', label: 'Pickup \u2192 Destination',
      render: (r: any) => `${r.pickup_location || '-'} \u2192 ${r.destination || '-'}`,
    },
    { key: 'required_date', label: 'Required Date', render: (r: any) => r.required_date ? new Date(r.required_date).toLocaleDateString() : '-' },
    { key: 'priority', label: 'Priority', render: (r: any) => renderPriority(r.priority) },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="actions">
          {(r.status === 'pending' || r.status === 'pending_review') && (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }} onClick={(e) => { e.stopPropagation(); approveMutation.mutate(r.id); }} disabled={approveMutation.isPending}>
                <CheckCircle size={14} /> Approve
              </button>
              <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(r.id); }} disabled={rejectMutation.isPending}>
                <XCircle size={14} /> Reject
              </button>
            </>
          )}
          <button className="btn btn-sm btn-danger" onClick={async (e) => { e.stopPropagation(); if (await confirm('Delete this request?')) deleteMutation.mutate(r.id); }} disabled={deleteMutation.isPending}>
            <Trash2 size={14} /> {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Transport Requests"
      subtitle="Manage transport requests from departments"
      actions={
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Request
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : ''}`}
            style={activeTab !== tab ? { background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' } : undefined}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No transport requests found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 640, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Transport Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <FormField label="Department" required>
                <select name="department_id" value={form.department_id} onChange={handleChange} required>
                  <option value="">Select department</option>
                  {(departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FormField>
              <div className="form-row">
                <FormField label="Pickup Location" required error={errors.pickup_location}>
                  <input name="pickup_location" value={form.pickup_location} onChange={handleChange} required />
                </FormField>
                <FormField label="Destination" required error={errors.destination}>
                  <input name="destination" value={form.destination} onChange={handleChange} required />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Required Date" required>
                  <input type="date" name="required_date" value={form.required_date} onChange={handleChange} required />
                </FormField>
                <FormField label="Priority">
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
