import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import Modal from '../../components/Modal';
import client from '../../api/client';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

interface DeliveryForm {
  trip_id: string;
  item: string;
  quantity: string;
  recipient: string;
  status: string;
}

const initialForm: DeliveryForm = {
  trip_id: '', item: '', quantity: '', recipient: '', status: 'pending',
};

const STATUS_OPTIONS = ['pending', 'in_transit', 'delivered', 'failed'];

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(searchParams.get('add') === 'true');
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<DeliveryForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['logistics-deliveries'],
    queryFn: () => client.get('/logistics/deliveries').then(r => r.data.data),
  });

  const { data: trips } = useQuery({
    queryKey: ['logistics-trips-all'],
    queryFn: () => client.get('/logistics/trips').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => client.post('/logistics/deliveries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Delivery created');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to create' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => client.put(`/logistics/deliveries/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      closeModal();
      toast.success('Delivery updated');
    },
    onError: (err: any) => {
      setErrors(err.response?.data?.errors || { submit: err.response?.data?.message || 'Failed to update' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/logistics/deliveries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['logistics-dashboard'] });
      toast.success('Delivery deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const filtered = (deliveries || []).filter((d: any) =>
    `${d.item || ''} ${d.recipient || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setSearchParams(new URLSearchParams());
  };

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setSearchParams(new URLSearchParams());
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      trip_id: String(item.trip_id || (item.trip?.id ?? '')),
      item: item.item || '',
      quantity: String(item.quantity || ''),
      recipient: item.recipient || '',
      status: item.status || 'pending',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      trip_id: form.trip_id ? Number(form.trip_id) : undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (item: any) => {
    if (window.confirm(`Delete delivery #${item.id}?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { pending: '#d97706', in_transit: '#2563eb', delivered: '#16a34a', failed: '#dc2626' };
    return <span style={{ color: '#fff', background: colors[status] || '#6b7280', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>{status.replace(/_/g, ' ')}</span>;
  };

  const columns: Column<any>[] = [
    { key: 'id', label: '#', render: (d: any) => `#${d.id}` },
    { key: 'item', label: 'Item', render: (d: any) => d.item || '-' },
    { key: 'quantity', label: 'Qty', render: (d: any) => d.quantity ?? '-' },
    { key: 'recipient', label: 'Recipient', render: (d: any) => d.recipient || '-' },
    {
      key: 'trip_number', label: 'Trip',
      render: (d: any) => d.trip_number ? `#${d.trip_number}${d.trip_destination ? ` - ${d.trip_destination}` : ''}` : d.trip_number || '-',
    },
    { key: 'status', label: 'Status', render: (d: any) => statusBadge(d.status) },
    {
      key: 'actions', label: 'Actions',
      render: (d: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ background: '#dbeafe', color: '#1e40af', border: 'none' }}
            onClick={e => { e.stopPropagation(); openEdit(d); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: 'none' }}
            onClick={e => { e.stopPropagation(); handleDelete(d); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Deliveries"
      subtitle="Manage deliveries"
      actions={
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> New Delivery
        </button>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="page-search" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card-bg)', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', color: 'var(--text)' }} placeholder="Search deliveries..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage="No deliveries found" />

      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Delivery' : 'New Delivery'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Trip" required>
            <select name="trip_id" value={form.trip_id} onChange={handleChange} required>
              <option value="">Select trip</option>
              {(trips || []).map((t: any) => (
                <option key={t.id} value={t.id}>Trip #{t.id}{t.destination ? ` - ${t.destination}` : ''}</option>
              ))}
            </select>
          </FormField>
          <div className="form-row">
            <FormField label="Item" required>
              <input name="item" value={form.item} onChange={handleChange} required />
            </FormField>
            <FormField label="Quantity" required>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
            </FormField>
          </div>
          <FormField label="Recipient" required>
            <input name="recipient" value={form.recipient} onChange={handleChange} required />
          </FormField>
          <FormField label="Status">
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </FormField>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </ModulePage>
  );
}
