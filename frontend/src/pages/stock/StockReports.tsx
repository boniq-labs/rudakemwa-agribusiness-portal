import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { stockAPI } from '../../api/endpoints';
import { Download, FileText, TrendingUp, Wheat, Pill, Wrench, Calendar } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function StockReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = dateFrom || dateTo ? { from: dateFrom || undefined, to: dateTo || undefined } : undefined;

  const { data: items } = useQuery({ queryKey: ['stock-items', params], queryFn: () => stockAPI.getItems(params).then(r => r.data.data || []) });
  const { data: transactions } = useQuery({ queryKey: ['stock-transactions', params], queryFn: () => stockAPI.getTransactions(params).then(r => r.data.data || []) });
  const { data: feed } = useQuery({ queryKey: ['stock-feed', params], queryFn: () => stockAPI.getFeed(params).then(r => r.data.data || []) });
  const { data: feedConsumption } = useQuery({ queryKey: ['stock-feed-consumption', params], queryFn: () => stockAPI.getFeedConsumption(params).then(r => r.data.data || []) });
  const { data: medicines } = useQuery({ queryKey: ['stock-medicines', params], queryFn: () => stockAPI.getMedicines(params).then(r => r.data.data || []) });
  const { data: equipment } = useQuery({ queryKey: ['stock-equipment', params], queryFn: () => stockAPI.getEquipment(params).then(r => r.data.data || []) });

  const exportCSV = (data: any[], filename: string, keys: string[]) => {
    const header = keys.join(',');
    const rows = data.map((row: any) => keys.map(k => {
      const val = typeof row[k] === 'object' ? row[k]?.name || row[k]?.id || '' : row[k] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const totalValue = (items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.purchase_price || 0), 0);
  const lowStockCount = (items || []).filter((i: any) => i.min_stock_level && Number(i.quantity) <= Number(i.min_stock_level)).length;
  const totalReceived = (transactions || []).filter((t: any) => t.type === 'receive').reduce((s: number, t: any) => s + Number(t.quantity || 0), 0);
  const totalIssued = (transactions || []).filter((t: any) => t.type === 'issue').reduce((s: number, t: any) => s + Number(t.quantity || 0), 0);
  const totalFeedConsumed = (feedConsumption || []).reduce((s: number, c: any) => s + Number(c.quantity || 0), 0);
  const totalFeedRemaining = (feed || []).reduce((s: number, f: any) => s + Number(f.quantity || 0), 0);
  const expiredMeds = (medicines || []).filter((m: any) => m.expiry_date && new Date(m.expiry_date) < new Date()).length;
  const equipByStatus = (equipment || []).reduce((acc: Record<string, number>, e: any) => {
    const s = e.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const inventoryColumns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: (i: any) => typeof i.category === 'object' ? i.category?.name : i.category || '-' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit', label: 'Unit' },
    { key: 'purchase_price', label: 'Unit Price', render: (i: any) => i.purchase_price ? Number(i.purchase_price).toLocaleString() : '-' },
    { key: 'total', label: 'Total Value', render: (i: any) => (Number(i.quantity || 0) * Number(i.purchase_price || 0)).toLocaleString() },
  ];

  const movementColumns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type', render: (t: any) => <StatusBadge status={t.type || t.type || 'unknown'} /> },
    { key: 'item', label: 'Item', render: (t: any) => typeof t.item === 'object' ? t.item?.name : t.item_name || t.item || '-' },
    { key: 'quantity', label: 'Qty' },
    { key: 'notes', label: 'Notes', render: (t: any) => t.notes || '-' },
  ];

  const ReportCard = ({ title, icon: Icon, children, onExport, exportLabel }: {
    title: string; icon: any; children: React.ReactNode; onExport?: () => void; exportLabel?: string;
  }) => (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} /> {title}
        </h3>
        {onExport && (
          <button className="btn btn-sm" onClick={onExport} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <Download size={14} /> {exportLabel || 'Export'}
          </button>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <ModulePage title="Stock Reports" subtitle="Comprehensive stock management reports"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '0.85rem' }} />
          <span className="text-secondary">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: '0.85rem' }} />
        </div>
      }
    >
      <ReportCard title="Inventory Report" icon={FileText}
        onExport={() => exportCSV(items || [], 'inventory-report', ['name', 'category', 'quantity', 'unit', 'purchase_price'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{(items || []).length}</div><div className="stat-label">Items</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalValue.toLocaleString()}</div><div className="stat-label">Total Value</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{lowStockCount}</div><div className="stat-label">Low Stock</div></div></div>
        </div>
        <DataTable columns={inventoryColumns} data={items || []} emptyMessage="No items" />
      </ReportCard>

      <ReportCard title="Stock Movement" icon={TrendingUp}
        onExport={() => exportCSV(transactions || [], 'stock-movement', ['date', 'type', 'item', 'quantity', 'notes'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalReceived}</div><div className="stat-label">Total Received</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalIssued}</div><div className="stat-label">Total Issued</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{(transactions || []).length}</div><div className="stat-label">Transactions</div></div></div>
        </div>
        <DataTable columns={movementColumns} data={transactions || []} emptyMessage="No transactions" />
      </ReportCard>

      <ReportCard title="Feed Report" icon={Wheat}
        onExport={() => exportCSV(feed || [], 'feed-report', ['name', 'category', 'quantity', 'unit', 'expiry_date'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalFeedRemaining}</div><div className="stat-label">Remaining</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalFeedConsumed}</div><div className="stat-label">Consumed</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{(feed || []).length}</div><div className="stat-label">Feed Items</div></div></div>
        </div>
        <DataTable columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'quantity', label: 'Qty' },
          { key: 'unit', label: 'Unit' },
          { key: 'expiry_date', label: 'Expiry', render: (f: any) => f.expiry_date || '-' },
        ]} data={feed || []} emptyMessage="No feed items" />
      </ReportCard>

      <ReportCard title="Medicine Report" icon={Pill}
        onExport={() => exportCSV(medicines || [], 'medicine-report', ['name', 'manufacturer', 'batch_number', 'quantity', 'expiry_date'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{(medicines || []).length}</div><div className="stat-label">Total Items</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{expiredMeds}</div><div className="stat-label">Expired</div></div></div>
        </div>
        <DataTable columns={[
          { key: 'name', label: 'Name' },
          { key: 'manufacturer', label: 'Manufacturer', render: (m: any) => m.manufacturer || '-' },
          { key: 'batch_number', label: 'Batch', render: (m: any) => m.batch_number || '-' },
          { key: 'quantity', label: 'Qty' },
          { key: 'expiry_date', label: 'Expiry' },
          { key: 'status', label: 'Status', render: (m: any) => {
            if (!m.expiry_date) return <StatusBadge status="valid" />;
            const diff = new Date(m.expiry_date).getTime() - Date.now();
            if (diff < 0) return <StatusBadge status="expired" />;
            if (diff <= 30 * 24 * 60 * 60 * 1000) return <StatusBadge status="low" />;
            return <StatusBadge status="active" />;
          }},
        ]} data={medicines || []} emptyMessage="No medicines" />
      </ReportCard>

      <ReportCard title="Equipment Report" icon={Wrench}
        onExport={() => exportCSV(equipment || [], 'equipment-report', ['name', 'type', 'condition', 'status', 'location'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          {(Object.entries(equipByStatus) as [string, number][]).map(([status, count]) => (
            <div key={status} className="stat-card">
              <div className="stat-info">
                <div className="stat-value">{count}</div>
                <div className="stat-label">{status}</div>
              </div>
            </div>
          ))}
        </div>
        <DataTable columns={[
          { key: 'name', label: 'Name' },
          { key: 'serial_number', label: 'Serial #', render: (e: any) => e.serial_number || '-' },
          { key: 'type', label: 'Type' },
          { key: 'condition', label: 'Condition' },
          { key: 'status', label: 'Status', render: (e: any) => <StatusBadge status={e.status || 'Available'} /> },
          { key: 'location', label: 'Location', render: (e: any) => e.location || '-' },
        ]} data={equipment || []} emptyMessage="No equipment" />
      </ReportCard>
    </ModulePage>
  );
}
