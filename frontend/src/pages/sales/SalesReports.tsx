import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { TrendingUp, Users } from 'lucide-react';
import { formatAmount } from '../../services/currency';

export default function SalesReports() {
  const { data: report } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: () => client.get('/sales/reports').then(r => r.data.data),
  });

  const r = (report as any) || { monthSales: 0, topProducts: [], activeCustomers: 0 };

  return (
    <ModulePage title="Sales Reports" subtitle="Sales analytics and reports">
      <div className="stats-grid">
        <StatsCard title="Month Sales" value={formatAmount(r.monthSales)} icon={TrendingUp} color="var(--primary)" />
        <StatsCard title="Active Customers" value={r.activeCustomers} icon={Users} color="var(--success)" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Top Products</h3>
          <div className="task-list" style={{ padding: 0 }}>
            {(r.topProducts || []).length === 0 && (
              <p style={{ padding: 24, color: 'var(--text-secondary)', textAlign: 'center' }}>No product data</p>
            )}
            {(r.topProducts || []).map((p: any, i: number) => (
              <div key={p.id || i} className="task-item">
                <div style={{ flex: 1 }}>
                  <div className="task-title">{p.name || `Product #${p.id}`}</div>
                  <div className="task-meta">{p.sold || p.quantity || 0} sold</div>
                </div>
                <span style={{ fontWeight: 600 }}>{formatAmount(Number(p.revenue || p.total || 0))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Summary</h3>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="text-secondary">Active Customers</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>{r.activeCustomers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span className="text-secondary">Month Sales</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatAmount(r.monthSales)}</span>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
