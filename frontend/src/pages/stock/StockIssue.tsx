import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import client from '../../api/client';
import { departmentsAPI } from '../../api/endpoints';
import { ArrowUpFromLine } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function StockIssue() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ item_id: '', quantity: '', issued_to: '', department_id: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: items } = useQuery({ queryKey: ['stock-all-items'], queryFn: () => client.get('/stock/all-items').then(r => r.data.data || []) });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsAPI.getAll().then(r => r.data.data || []) });
  const { data: history, isLoading } = useQuery({
    queryKey: ['stock-transactions-issue'],
    queryFn: () => client.get('/stock/transactions', { params: { type: 'issue' } }).then(r => r.data.data || []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => client.post('/stock/transactions/issue', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transactions-issue'] });
      queryClient.invalidateQueries({ queryKey: ['stock-all-items'] });
      setForm({ item_id: '', quantity: '', issued_to: '', department_id: '', date: new Date().toISOString().split('T')[0], notes: '' });
      setErrors({});
      toast.success('Stock issued successfully');
    },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to issue stock' }); toast.error('Failed to issue stock'); },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const selected = (items || []).find((i: any) => (i.inventory_item_id ?? i.id) === Number(form.item_id));
    mutation.mutate({
      item_id: Number(form.item_id),
      source_id: selected?.id ?? Number(form.item_id),
      source_type: selected?.source_type || 'inventory',
      quantity: Number(form.quantity),
      issued_to: form.issued_to,
      department_id: form.department_id ? Number(form.department_id) : undefined,
      issued_date: form.date,
      notes: form.notes,
    });
  };

  const histColumns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item', render: (t: any) => typeof t.item === 'object' ? t.item?.name : t.item_name || t.item || '-' },
    { key: 'quantity', label: 'Qty' },
    { key: 'issued_to', label: 'Issued To', render: (t: any) => t.issued_to || '-' },
    { key: 'department', label: 'Department', render: (t: any) => typeof t.department === 'object' ? t.department?.name : t.department || '-' },
    { key: 'notes', label: 'Notes', render: (t: any) => t.notes || '-' },
  ];

  return (
    <ModulePage title="Stock Issue" subtitle="Issue stock to departments">
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><ArrowUpFromLine size={18} style={{ marginRight: 8 }} />New Issue</h3>
        <form onSubmit={handleSubmit}>
          <FormField label="Item" required>
            <select name="item_id" value={form.item_id} onChange={handleChange} required>
                <option value="">Select item</option>
                {(items || []).map((it: any) => {
                  const id = it.inventory_item_id ?? it.id;
                  const label = it.source_type ? `${it.source_type.charAt(0).toUpperCase() + it.source_type.slice(1)} - ${it.name}` : it.name;
                  return <option key={`${it.source_type}-${it.id}`} value={id}>{label} (on hand: {it.quantity})</option>;
                })}
              </select>
          </FormField>
          <div className="form-row">
            <FormField label="Quantity" required>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
            </FormField>
            <FormField label="Date">
              <input type="date" name="date" value={form.date} onChange={handleChange} />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Issued To">
              <input name="issued_to" value={form.issued_to} onChange={handleChange} placeholder="Person name" />
            </FormField>
            <FormField label="Department">
              <select name="department_id" value={form.department_id} onChange={handleChange}>
                <option value="">Select department</option>
                {(departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} />
          </FormField>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Issue Stock'}
            </button>
          </div>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Issue History</h3>
      <DataTable columns={histColumns} data={history || []} loading={isLoading} emptyMessage="No issue records" />
    </ModulePage>
  );
}
