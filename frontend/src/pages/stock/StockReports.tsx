import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { stockAPI } from '../../api/endpoints';
import { Download, Wheat, Pill, Wrench, Calendar } from 'lucide-react';

export default function StockReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params = dateFrom || dateTo ? { from: dateFrom || undefined, to: dateTo || undefined } : undefined;

  const { data: feed } = useQuery({ queryKey: ['stock-feed', params], queryFn: () => stockAPI.getFeed(params).then(r => r.data.data || []) });
  const { data: feedConsumption } = useQuery({ queryKey: ['stock-feed-consumption', params], queryFn: () => stockAPI.getFeedConsumption(params).then(r => r.data.data || []) });
  const { data: medicines } = useQuery({ queryKey: ['stock-medicines', params], queryFn: () => stockAPI.getMedicines(params).then(r => r.data.data || []) });
  const { data: equipment } = useQuery({ queryKey: ['stock-equipment', params], queryFn: () => stockAPI.getEquipment(params).then(r => r.data.data || []) });

  const totalFeedConsumed = (feedConsumption || []).reduce((s: number, c: any) => s + Number(c.quantity || 0), 0);
  const totalFeedRemaining = (feed || []).reduce((s: number, f: any) => s + Number(f.quantity || 0), 0);
  const expiredMeds = (medicines || []).filter((m: any) => m.expiry_date && new Date(m.expiry_date) < new Date()).length;
  const equipByStatus = (equipment || []).reduce((acc: Record<string, number>, e: any) => {
    const s = e.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  const totalFeed = (feed || []).length;
  const totalMedicine = (medicines || []).length;
  const totalEquipment = (equipment || []).length;
  const totalItems = totalFeed + totalMedicine + totalEquipment;
  const lowStockCount = (feed || []).filter((f: any) => f.min_stock_level && Number(f.quantity) <= Number(f.min_stock_level)).length
    + (medicines || []).filter((m: any) => m.min_stock_level && Number(m.quantity) <= Number(m.min_stock_level)).length
    + (equipment || []).filter((e: any) => e.min_stock_level && Number(e.quantity) <= Number(e.min_stock_level)).length;

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
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalFeed}</div><div className="stat-label">Total Feed</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalMedicine}</div><div className="stat-label">Total Medicine</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalEquipment}</div><div className="stat-label">Total Equipment</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{totalItems}</div><div className="stat-label">Total Items</div></div></div>
        <div className="stat-card"><div className="stat-info"><div className="stat-value">{lowStockCount}</div><div className="stat-label">Low Stock</div></div></div>
      </div>

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
        onExport={() => exportCSV(medicines || [], 'medicine-report', ['name', 'brand', 'category', 'quantity', 'expiry_date'])}
        exportLabel="Export CSV"
      >
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{(medicines || []).length}</div><div className="stat-label">Total Items</div></div></div>
          <div className="stat-card"><div className="stat-info"><div className="stat-value">{expiredMeds}</div><div className="stat-label">Expired</div></div></div>
        </div>
        <DataTable columns={[
          { key: 'name', label: 'Name' },
          { key: 'brand', label: 'Brand', render: (m: any) => m.brand || '-' },
          { key: 'category', label: 'Category', render: (m: any) => m.category || '-' },
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
          { key: 'model', label: 'Type', render: (e: any) => e.model || e.category || '-' },
          { key: 'item_condition', label: 'Condition', render: (e: any) => e.item_condition || '-' },
          { key: 'status', label: 'Status', render: (e: any) => <StatusBadge status={e.status || 'Available'} /> },
          { key: 'location', label: 'Location', render: (e: any) => e.location || '-' },
        ]} data={equipment || []} emptyMessage="No equipment" />
      </ReportCard>
    </ModulePage>
  );
}
