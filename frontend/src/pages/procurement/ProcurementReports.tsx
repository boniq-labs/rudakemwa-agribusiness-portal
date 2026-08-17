import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { ShoppingCart, TrendingUp, Star } from 'lucide-react';

export default function ProcurementReports() {
  const { data } = useQuery({
    queryKey: ['procurement-reports'],
    queryFn: () => client.get('/procurement/reports').then(r => r.data.data),
  });

  return (
    <ModulePage title="Procurement Reports" subtitle="Procurement performance and spending">
      <div className="stats-grid">
        <StatsCard title="Total Orders" value={data?.total_orders ?? 0} icon={ShoppingCart} color="var(--info)" />
        <StatsCard title="Active Suppliers" value={data?.active_suppliers ?? 0} icon={Star} color="var(--success)" />
        <StatsCard title="Pending Payments" value={data?.pending_payments ? `RWF ${Number(data.pending_payments).toLocaleString()}` : 'RWF 0'} icon={TrendingUp} color="var(--danger)" />
      </div>
    </ModulePage>
  );
}
