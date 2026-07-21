import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { TrendingUp, Clock, Users, Plus, FileText } from 'lucide-react';
import { formatAmount } from '../../services/currency';

export default function SalesDashboard() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['sales-dashboard'],
    queryFn: () => client.get('/sales/dashboard').then(r => r.data.data),
  });

  const d = (dashboard as any) || { monthSales: 0, pendingOrders: 0, customersCount: 0, recentOrders: [] };

  return (
    <ModulePage
      title="Sales Dashboard"
      subtitle="Sales overview and key metrics"
      actions={
        <>
          <button className="btn btn-primary" onClick={() => navigate('/sales/orders?add=true')}>
            <Plus size={16} /> New Order
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/sales/invoices?add=true')}>
            <FileText size={16} /> Create Invoice
          </button>
        </>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Month Sales" value={formatAmount(d.monthSales)} icon={TrendingUp} color="var(--primary)" />
        <StatsCard title="Pending Orders" value={d.pendingOrders} icon={Clock} color="var(--warning)" />
        <StatsCard title="Customers" value={d.customersCount} icon={Users} color="var(--success)" />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Recent Orders</h3>
        <div className="task-list" style={{ padding: 0 }}>
          {d.recentOrders.length === 0 && (
            <p style={{ padding: 24, color: 'var(--text-secondary)', textAlign: 'center' }}>No orders yet</p>
          )}
          {d.recentOrders.map((o: any) => (
            <div key={o.id} className="task-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/sales/orders?id=${o.id}`)}>
              <div style={{ flex: 1 }}>
                <div className="task-title">{o.order_number || `Order #${o.id}`}</div>
                <div className="task-meta">{o.customer_name || 'Unknown'} &middot; {formatAmount(Number(o.total_amount || o.amount) || 0)}</div>
              </div>
              <span className={`badge badge-${o.status === 'completed' || o.status === 'delivered' ? 'success' : o.status === 'pending' ? 'warning' : 'info'}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </ModulePage>
  );
}
