import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import { Package, Wheat, Pill, Wrench, AlertTriangle, ClipboardList } from 'lucide-react';
import DepartmentHeader from '../../components/DepartmentHeader';
import type { Column } from '../../components/DataTable';
import client from '../../api/client';

export default function StockDashboard() {
  const { data: dashboard } = useQuery({
    queryKey: ['stock-dashboard-stats'],
    queryFn: () => client.get('/dashboard/stock').then(r => r.data.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => client.get('/stock/low-stock').then(r => r.data.data || []),
  });

  const totalFeed = dashboard?.totalFeedItems ?? 0;
  const totalMedicine = dashboard?.totalMedicineItems ?? 0;
  const totalEquipment = dashboard?.totalEquipmentItems ?? 0;
  const totalStock = dashboard?.totalStockItems ?? 0;
  const lowStockCount = dashboard?.lowStockItems ?? 0;

  const recentFeed: any[] = dashboard?.recentFeed || [];
  const recentMedicine: any[] = dashboard?.recentMedicine || [];
  const recentEquipment: any[] = dashboard?.recentEquipment || [];

  const recentAll = [
    ...recentFeed.map((r: any) => ({ ...r, source: 'Feed' })),
    ...recentMedicine.map((r: any) => ({ ...r, source: 'Medicine' })),
    ...recentEquipment.map((r: any) => ({ ...r, source: 'Equipment' })),
  ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  const lowStockColumns: Column<any>[] = [
    { key: 'name', label: 'Item' },
    { key: 'quantity', label: 'On Hand' },
    { key: 'min_stock_level', label: 'Min Level' },
    { key: 'unit', label: 'Unit' },
  ];

  const recentColumns: Column<any>[] = [
    { key: 'source', label: 'Source' },
    { key: 'name', label: 'Name' },
    { key: 'quantity', label: 'Qty' },
    { key: 'created_at', label: 'Date', render: (r: any) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
  ];

  return (
    <ModulePage title="Stock Dashboard" subtitle="Real-time stock management overview">
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Feed Items" value={totalFeed} icon={Wheat} color="#d97706" />
        <StatsCard title="Total Medicine Items" value={totalMedicine} icon={Pill} color="#2563eb" />
        <StatsCard title="Total Equipment Items" value={totalEquipment} icon={Wrench} color="#16a34a" />
        <StatsCard title="Total Stock Items" value={totalStock} icon={Package} color="#8b5cf6" />
        <StatsCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} color="#dc2626" />
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Stock</h3>
          </div>
          <DataTable columns={recentColumns} data={recentAll} emptyMessage="No stock items yet" />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={18} style={{ color: '#dc2626' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Low Stock Alerts</h3>
          </div>
          {Array.isArray(lowStock) && lowStock.length > 0 ? (
            <DataTable columns={lowStockColumns} data={lowStock} />
          ) : (
            <p className="text-secondary">No low stock items</p>
          )}
        </div>
      </div>
    </ModulePage>
  );
}