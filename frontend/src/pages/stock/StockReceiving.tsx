import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { stockAPI, procurementAPI } from '../../api/endpoints';
import { ArrowDownToLine } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function StockReceiving() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ item_id: '', quantity: '', unit_price: '', supplier_id: '', date: new Date().toISOString().split('T')[0], notes: '', reference: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: items } = useQuery({ queryKey: ['stock-items'], queryFn: () => stockAPI.getItems().then(r => r.data.data || []) });
  const { data: suppliers } = useQuery({ queryKey: ['procurement-suppliers'], queryFn: () => procurementAPI.getSuppliers().then(r => r.data.data || []) });
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['stock-transactions-receive'],
    queryFn: () => stockAPI.getTransactions({ type: 'receive' }).then((r: any) => r.data.data || []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => stockAPI.receive(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transactions-receive'] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      setForm(prev => ({ ...prev, quantity: '', unit_price: '', notes: '', reference: '' }));
      setErrors({});
    },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to receive stock' }); },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate({
      item_id: Number(form.item_id),
      quantity: Number(form.quantity),
      unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : undefined,
      date: form.date,
      notes: form.notes,
      reference: form.reference,
    });
  };

  const columns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item', render: (t: any) => typeof t.item === 'object' ? t.item?.name : t.item_name || t.item || '-' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_price', label: 'Unit Price', render: (t: any) => t.unit_price ? Number(t.unit_price).toLocaleString() : '-' },
    { key: 'total_value', label: 'Total', render: (t: any) => (t.quantity * t.unit_price) ? (Number(t.quantity) * Number(t.unit_price)).toLocaleString() : '-' },
    { key: 'supplier', label: 'Supplier', render: (t: any) => typeof t.supplier === 'object' ? t.supplier?.name : t.supplier || '-' },
    { key: 'notes', label: 'Notes', render: (t: any) => t.notes || '-' },
  ];

  return (
    <ModulePage title="Stock Receiving" subtitle="Receive new stock into inventory">
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><ArrowDownToLine size={18} style={{ marginRight: 8 }} />New Receiving</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField label="Item" required>
              <select name="item_id" value={form.item_id} onChange={handleChange} required>
                <option value="">Select item</option>
                {(items || []).map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>)}
              </select>
            </FormField>
            <FormField label="Quantity" required>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Unit Price">
              <input type="number" step="0.01" name="unit_price" value={form.unit_price} onChange={handleChange} />
            </FormField>
            <FormField label="Supplier">
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                <option value="">Select supplier</option>
                {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Date" required>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </FormField>
            <FormField label="Reference">
              <input name="reference" value={form.reference} onChange={handleChange} placeholder="PO # / Invoice #" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
          </FormField>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Receiving History</h3>
      <DataTable columns={columns} data={transactions || []} loading={isLoading} emptyMessage="No receiving records" />
    </ModulePage>
  );
}
