import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import FormField from '../../components/FormField';
import { stockAPI } from '../../api/endpoints';
import { Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function StockAdjustment() {
  const queryClient = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [currentQty, setCurrentQty] = useState<number | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: items } = useQuery({ queryKey: ['stock-all-items'], queryFn: () => stockAPI.getAllItems().then(r => r.data.data || []) });
  const { data: history, isLoading } = useQuery({
    queryKey: ['stock-transactions-adjust'],
    queryFn: () => stockAPI.getTransactions({ type: 'adjustment' }).then(r => r.data.data || []),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => stockAPI.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transactions-adjust'] });
      queryClient.invalidateQueries({ queryKey: ['stock-all-items'] });
      setNewQuantity('');
      setReason('');
      setNotes('');
      setErrors({});
      toast.success('Stock adjusted successfully');
    },
    onError: (err: any) => { setErrors({ submit: err.response?.data?.message || 'Failed to adjust stock' }); toast.error('Failed to adjust stock'); },
  });

  const getItemId = (i: any) => i.inventory_item_id ?? i.id;

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setItemId(id);
    const item = (items || []).find((i: any) => getItemId(i) === Number(id));
    setCurrentQty(item ? Number(item.quantity) : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const selected = (items || []).find((i: any) => getItemId(i) === Number(itemId));
    mutation.mutate({
      item_id: Number(itemId),
      source_id: selected?.id ?? Number(itemId),
      source_type: selected?.source_type || 'inventory',
      new_quantity: Number(newQuantity),
      reason,
      notes,
    });
  };

  const diff = currentQty !== null && newQuantity ? Number(newQuantity) - currentQty : 0;

  const columns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'item', label: 'Item', render: (t: any) => typeof t.item === 'object' ? t.item?.name : t.item_name || t.item || '-' },
    { key: 'old_quantity', label: 'Previous Qty', render: (t: any) => t.old_quantity ?? t.previous_quantity ?? '-' },
    { key: 'new_quantity', label: 'New Qty', render: (t: any) => t.new_quantity ?? '-' },
    { key: 'reason', label: 'Reason', render: (t: any) => t.reason || '-' },
    { key: 'notes', label: 'Notes', render: (t: any) => t.notes || '-' },
  ];

  return (
    <ModulePage title="Stock Adjustment" subtitle="Adjust stock levels with reason">
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 600 }}><Scale size={18} style={{ marginRight: 8 }} />New Adjustment</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <FormField label="Item" required>
              <select value={itemId} onChange={handleItemChange} required>
                <option value="">Select item</option>
                {(items || []).map((i: any) => {
                  const id = getItemId(i);
                  const label = i.source_type ? `${i.source_type.charAt(0).toUpperCase() + i.source_type.slice(1)} - ${i.name}` : i.name;
                  return <option key={`${i.source_type}-${i.id}`} value={id}>{label} (current: {i.quantity})</option>;
                })}
              </select>
            </FormField>
            <FormField label="Current Quantity">
              <input value={currentQty ?? ''} disabled style={{ background: 'var(--bg)' }} />
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="New Quantity" required>
              <input type="number" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} required />
            </FormField>
            <FormField label="Difference">
              <input value={diff ? (diff > 0 ? `+${diff}` : diff) : ''} disabled style={{ background: 'var(--bg)', color: diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : undefined }} />
            </FormField>
          </div>
          <FormField label="Reason" required>
            <select value={reason} onChange={e => setReason(e.target.value)} required>
              <option value="">Select reason</option>
              <option value="Stock Count">Stock Count</option>
              <option value="Damaged">Damaged</option>
              <option value="Expired">Expired</option>
              <option value="Theft">Theft</option>
              <option value="Spoilage">Spoilage</option>
              <option value="Data Correction">Data Correction</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </FormField>
          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>

      <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Adjustment History</h3>
      <DataTable columns={columns} data={history || []} loading={isLoading} emptyMessage="No adjustments found" />
    </ModulePage>
  );
}
