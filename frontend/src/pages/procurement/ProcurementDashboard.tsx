import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import { Users, ShoppingCart, Clock } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function ProcurementDashboard() {
  const { data } = useQuery({
    queryKey: ['procurement-dashboard'],
    queryFn: () => client.get('/dashboard/procurement').then(r => r.data.data || r.data),
  });

  const d = data || {};
  const recentOrders: any[] = d.recentOrders || d.recent_orders || [];

  const orderColumns: Column<any>[] = [
    { key: 'po_number', label: 'PO #' },
    { key: 'supplier_name', label: 'Supplier', render: (r: any) => r.supplier_name || '-' },
    { key: 'status', label: 'Status' },
    { key: 'order_date', label: 'Date', render: (r: any) => r.order_date ? new Date(r.order_date).toLocaleDateString() : '-' },
    { key: 'total_cost', label: 'Total', render: (r: any) => `RWF ${Number(r.total_cost ?? r.total_amount ?? 0).toLocaleString()}` },
  ];

  return (
    <ModulePage title="Procurement Dashboard" subtitle="Overview of procurement metrics">
      <div className="stats-grid">
        <StatsCard title="Total Suppliers" value={d.totalSuppliers ?? 0} icon={Users} color="#2563eb" />
        <StatsCard title="Total Purchases" value={`RWF ${Number(d.totalPurchases ?? 0).toLocaleString()}`} icon={ShoppingCart} color="#16a34a" />
        <StatsCard title="Pending Orders" value={d.pendingOrders ?? 0} icon={Clock} color="#d97706" />
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Purchase Orders</h3>
          <DataTable columns={orderColumns} data={recentOrders} emptyMessage="No purchase orders yet" />
        </div>
      </div>
    </ModulePage>
  );
}
