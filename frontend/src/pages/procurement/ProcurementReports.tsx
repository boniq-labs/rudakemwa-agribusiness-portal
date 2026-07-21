import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { DollarSign, TrendingUp, ShoppingCart, Star } from 'lucide-react';

export default function ProcurementReports() {
  const { data } = useQuery({
    queryKey: ['procurement-reports'],
    queryFn: () => client.get('/procurement/reports').then(r => r.data.data),
  });

  return (
    <ModulePage title="Procurement Reports" subtitle="Procurement performance and spending">
      <div className="stats-grid">
        <StatsCard title="Total Spending" value={data?.total_spending ? `$${Number(data.total_spending).toLocaleString()}` : '$0'} icon={DollarSign} color="var(--primary)" />
        <StatsCard title="Total Orders" value={data?.total_orders ?? 0} icon={ShoppingCart} color="var(--info)" />
        <StatsCard title="Pending Payments" value={data?.pending_payments ? `$${Number(data.pending_payments).toLocaleString()}` : '$0'} icon={TrendingUp} color="var(--danger)" />
        <StatsCard title="Active Suppliers" value={data?.active_suppliers ?? 0} icon={Star} color="var(--success)" />
      </div>
    </ModulePage>
  );
}
