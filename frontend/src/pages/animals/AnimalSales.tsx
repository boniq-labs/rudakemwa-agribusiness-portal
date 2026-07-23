import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import type { Column } from '../../components/DataTable';
import { Plus, DollarSign, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnimalSales() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    animal_id: '', customer_name: '', sale_date: new Date().toISOString().split('T')[0],
    price: '', payment_status: 'pending', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => (await client.get('/animals/sales')).data.data || [],
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: async () => (await client.get('/animals/select')).data.data || [],
  });

  const sales = Array.isArray(data) ? data : [];
  const animals = Array.isArray(animalsData) ? animalsData : [];

  const createMutation = useMutation({
    mutationFn: (d: any) => client.post('/animals/sales', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Sale record created');
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to save sale record'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => client.put(`/animals/sales/${d.id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Sale record updated');
      setShowModal(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update sale record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/animals/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: ['animal-dashboard-stats'] });
      toast.success('Sale record deleted');
    },
    onError: () => toast.error('Failed to delete sale record'),
  });

  const resetForm = () => {
    setForm({ animal_id: '', customer_name: '', sale_date: new Date().toISOString().split('T')[0], price: '', payment_status: 'pending', notes: '' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      animal_id: String(item.animal_id),
      customer_name: item.customer_name || '',
      sale_date: item.sale_date ? item.sale_date.split('T')[0] : '',
      price: item.price ? String(item.price) : '',
      payment_status: item.payment_status || 'pending',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      animal_id: Number(form.animal_id),
      customer_name: form.customer_name,
      sale_date: form.sale_date,
      price: Number(form.price),
      payment_status: form.payment_status,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'animal', label: 'Animal',
      render: (item: any) => item.animal_name || item.tag_number || `#${item.animal_id}`,
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'sale_date', label: 'Date',
      render: (item: any) => item.sale_date ? new Date(item.sale_date).toLocaleDateString() : '-',
    },
    {
      key: 'price', label: 'Price',
      render: (item: any) => item.price ? `$${Number(item.price).toFixed(2)}` : '-',
    },
    {
      key: 'payment_status', label: 'Payment Status',
      render: (item: any) => <StatusBadge status={item.payment_status || 'pending'} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
          <button className="btn btn-sm" title="Delete" onClick={() => { if (confirm('Delete this sale record?')) deleteMutation.mutate(item.id); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Animal Sales"
      subtitle="Record and manage animal sales"
      actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Record Sale</button>}
    >
      <DataTable columns={columns} data={sales} loading={isLoading} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: '100%', maxWidth: 500, border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><DollarSign size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />{editingId ? 'Edit' : 'Record'} Sale</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Animal *</label>
                <select className="form-select" value={form.animal_id} onChange={e => setForm(p => ({ ...p, animal_id: e.target.value }))} required>
                  <option value="">Select animal</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.tag_number} - {a.name || 'Unnamed'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="form-input" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Date *</label>
                <input className="form-input" type="date" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price ($) *</label>
                <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Status</label>
                <select className="form-select" value={form.payment_status} onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
