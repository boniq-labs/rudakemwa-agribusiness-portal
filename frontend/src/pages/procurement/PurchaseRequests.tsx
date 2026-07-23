import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import toast from 'react-hot-toast';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { Column } from '../../components/DataTable';

const STATUSES = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];

interface RequestForm {
  item_name: string; quantity: string; unit: string; estimated_cost: string;
  department_id: string; requested_by: string; status: string; notes: string;
}

const initialForm: RequestForm = {
  item_name: '', quantity: '1', unit: 'pcs', estimated_cost: '',
  department_id: '', requested_by: '', status: 'pending', notes: '',
};

export default function PurchaseRequests() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: requests, isLoading } = useQuery({
    queryKey: ['procurement-requests'],
    queryFn: () => client.get('/procurement/requests').then(r => r.data.data || []),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => client.get('/departments').then(r => r.data.data || []),
  });

  const statusMap: Record<string, string> = { All: '', Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Completed: 'completed' };
  const filtered = (requests || []).filter((r: any) => !statusMap[activeTab] || r.status === statusMap[activeTab]);

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/procurement/requests', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-requests'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); closeModal(); toast.success('Request created'); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to create request' }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/procurement/requests/${data.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-requests'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); closeModal(); toast.success('Request updated'); },
    onError: (err: any) => setErrors({ submit: err.response?.data?.message || 'Failed to update request' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/procurement/requests/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['procurement-requests'] }); queryClient.invalidateQueries({ queryKey: ['procurement-dashboard'] }); toast.success('Request deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(initialForm); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload = {
      item_name: form.item_name,
      quantity: Number(form.quantity),
      unit: form.unit,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined,
      department_id: form.department_id ? Number(form.department_id) : undefined,
      requested_by: form.requested_by,
      status: form.status || 'pending',
      notes: form.notes,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openEdit = (item: any) => {
    setForm({
      item_name: item.item_name || '',
      quantity: String(item.quantity || 1),
      unit: item.unit || 'pcs',
      estimated_cost: String(item.estimated_cost || ''),
      department_id: String(item.department_id || ''),
      requested_by: item.requested_by || '',
      status: item.status || 'pending',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const columns: Column<any>[] = [
    { key: 'item_name', label: 'Item Name' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit', label: 'Unit' },
    { key: 'estimated_cost', label: 'Est. Cost', render: (r: any) => r.estimated_cost ? `$${Number(r.estimated_cost).toLocaleString()}` : '-' },
    { key: 'department_name', label: 'Department', render: (r: any) => r.department_name || r.department || '-' },
    { key: 'requested_by', label: 'Requested By' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'pending'} /> },
    {
      key: 'actions', label: 'Actions', render: (r: any) => (
        <div className="actions">
          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); openEdit(r); }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}><Edit2 size={14} /></button>
          <button className="btn btn-sm" onClick={e => { e.stopPropagation(); if (confirm('Delete this request?')) deleteMutation.mutate(r.id); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Purchase Requests"
      subtitle="Manage purchase requests"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }}>
          <Plus size={16} /> New Request
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

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No purchase requests found" />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 560, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingId ? 'Edit Request' : 'New Request'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <FormField label="Item Name" required>
                  <input name="item_name" value={form.item_name} onChange={handleChange} required />
                </FormField>
                <FormField label="Quantity" required>
                  <input type="number" min={1} name="quantity" value={form.quantity} onChange={handleChange} required />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Unit" required>
                  <select name="unit" value={form.unit} onChange={handleChange} required>
                    <option value="pcs">Pieces</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">L</option>
                    <option value="ml">mL</option>
                    <option value="bags">Bags</option>
                    <option value="boxes">Boxes</option>
                    <option value="litres">Litres</option>
                  </select>
                </FormField>
                <FormField label="Estimated Cost">
                  <input type="number" min={0} step="0.01" name="estimated_cost" value={form.estimated_cost} onChange={handleChange} />
                </FormField>
              </div>
              <div className="form-row">
                <FormField label="Department" required>
                  <select name="department_id" value={form.department_id} onChange={handleChange} required>
                    <option value="">Select department</option>
                    {(departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Requested By" required>
                  <input name="requested_by" value={form.requested_by} onChange={handleChange} required />
                </FormField>
              </div>
              {editingId && (
                <FormField label="Status">
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </FormField>
              )}
              <FormField label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
              </FormField>
              {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update Request' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
