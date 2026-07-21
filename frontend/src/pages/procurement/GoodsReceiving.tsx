import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import { procurementAPI } from '../../api/endpoints';
import type { Column } from '../../components/DataTable';

export default function GoodsReceiving() {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['procurement', 'orders', 'received'],
    queryFn: () => procurementAPI.getOrders({ status: 'received' }).then(r => r.data.data),
  });

  const receipts = (orders || []).map((o: any) => ({
    ...o,
    receipt_number: o.receipt_number || `GR-${String(o.id).padStart(4, '0')}`,
    received_date: o.received_at || o.updated_at || o.order_date,
    receiver: o.receiver || o.received_by || '-',
  }));

  const columns: Column<any>[] = [
    { key: 'receipt_number', label: 'Receipt #' },
    {
      key: 'id', label: 'PO #',
      render: (r: any) => (
        <a href="#" onClick={e => { e.preventDefault(); navigate('/procurement/orders'); }}
          style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          PO-{String(r.id).padStart(4, '0')}
        </a>
      ),
    },
    {
      key: 'supplier', label: 'Supplier',
      render: (r: any) => typeof r.supplier === 'object' ? r.supplier?.company_name || r.supplier?.name || '-' : r.supplier || '-',
    },
    {
      key: 'received_date', label: 'Received Date',
      render: (r: any) => r.received_date ? new Date(r.received_date).toLocaleDateString() : '-',
    },
    {
      key: 'items_count', label: 'Items',
      render: (r: any) => r.items?.length || r.items_count || 0,
    },
    { key: 'receiver', label: 'Receiver' },
  ];

  return (
    <ModulePage
      title="Goods Receiving"
      subtitle="History of received goods"
    >
      <DataTable columns={columns} data={receipts} loading={isLoading} emptyMessage="No goods receipts found" />
    </ModulePage>
  );
}
