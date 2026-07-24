import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import { ClipboardList, ShoppingCart, FileText, TrendingUp } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function ProcurementDashboard() {
  const { data } = useQuery({
    queryKey: ['procurement-dashboard'],
    queryFn: () => client.get('/dashboard/procurement').then(r => r.data.data),
  });

  const d = data || {};
  const recentOrders: any[] = d.recent_orders || [];

  const orderColumns: Column<any>[] = [
    { key: 'po_number', label: 'PO #' },
    { key: 'supplier_name', label: 'Supplier', render: (r: any) => r.supplier_name || '-' },
    { key: 'status', label: 'Status' },
    { key: 'order_date', label: 'Date', render: (r: any) => r.order_date ? new Date(r.order_date).toLocaleDateString() : '-' },
  ];

  return (
    <ModulePage title="Procurement Dashboard" subtitle="Overview of procurement metrics">
      <div className="stats-grid">
        <StatsCard title="Total Purchase Requests" value={d.total_purchase_requests ?? 0} icon={ClipboardList} color="#d97706" />
        <StatsCard title="Total Purchase Orders" value={d.total_purchase_orders ?? 0} icon={ShoppingCart} color="#2563eb" />
        <StatsCard title="Total Contracts" value={d.total_contracts ?? 0} icon={FileText} color="#16a34a" />
        <StatsCard title="Total Invoices" value={d.total_invoices ?? 0} icon={TrendingUp} color="#8b5cf6" />
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
