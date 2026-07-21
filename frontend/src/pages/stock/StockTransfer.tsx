import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { stockAPI } from '../../api/endpoints';
import { ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function StockTransfer() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ item_id: '', from_location: '', to_location: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: items } = useQuery({ queryKey: ['stock-all-items'], queryFn: () => stockAPI.getAllItems().then(r => r.data.data || []) });
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['stock-transactions-transfer'],
    queryFn: () => stockAPI.getTransactions({ type: 'transfer' }).then(r => r.data.data || []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => stockAPI.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transactions-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['stock-all-items'] });
      setForm(prev => ({ ...prev, quantity: '', notes: '' }));
      setErrors({});
      toast.success('Stock transferred successfully');
    },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to transfer stock' }); toast.error('Failed to transfer stock'); },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (form.from_location === form.to_location) {
      setErrors({ submit: 'From and To locations must be different' });
      return;
    }
    const selected = (items || []).find((i: any) => (i.inventory_item_id ?? i.id) === Number(form.item_id));
    mutation.mutate({
      item_id: Number(form.item_id),
      source_id: selected?.id ?? Number(form.item_id),
      source_type: selected?.source_type || 'inventory',
      from_location: form.from_location,
      to_location: form.to_location,
      quantity: Number(form.quantity),
      date: form.date,
      notes: form.notes,
    });
  };

  const columns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item', render: (t: any) => typeof t.item === 'object' ? t.item?.name : t.item_name || t.item || '-' },
    { key: 'from_location', label: 'From', render: (t: any) => t.from_location || '-' },
    { key: 'to_location', label: 'To', render: (t: any) => t.to_location || '-' },
    { key: 'quantity', label: 'Qty' },
    { key: 'notes', label: 'Notes', render: (t: any) => t.notes || '-' },
  ];

  return (
    <ModulePage title="Stock Transfer" subtitle="Transfer stock between locations">
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><ArrowRightLeft size={18} style={{ marginRight: 8 }} />New Transfer</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField label="Item" required>
              <select name="item_id" value={form.item_id} onChange={handleChange} required>
                <option value="">Select item</option>
                {(items || []).map((i: any) => {
                  const id = i.inventory_item_id ?? i.id;
                  const label = i.source_type ? `${i.source_type.charAt(0).toUpperCase() + i.source_type.slice(1)} - ${i.name}` : i.name;
                  return <option key={`${i.source_type}-${i.id}`} value={id}>{label} ({i.quantity} {i.unit})</option>;
                })}
              </select>
            </FormField>
            <FormField label="Quantity" required>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="From Location" required>
              <input name="from_location" value={form.from_location} onChange={handleChange} required placeholder="e.g. Main Store" />
            </FormField>
            <FormField label="To Location" required>
              <input name="to_location" value={form.to_location} onChange={handleChange} required placeholder="e.g. Barn A" />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Date" required>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </FormField>
            <FormField label="Notes">
              <input name="notes" value={form.notes} onChange={handleChange} />
            </FormField>
          </div>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Transfer Stock'}
            </button>
          </div>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Transfer History</h3>
      <DataTable columns={columns} data={transactions || []} loading={isLoading} emptyMessage="No transfers found" />
    </ModulePage>
  );
}
