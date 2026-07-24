import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import client from '../../api/client';
import { Truck, Users, ClipboardList, Route, Wrench, Package } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function LogisticsDashboard() {
  const { data: dashboard } = useQuery({
    queryKey: ['logistics-dashboard'],
    queryFn: () => client.get('/dashboard/logistics').then(r => r.data.data),
  });

  const { data: trips } = useQuery({
    queryKey: ['logistics-recent-trips'],
    queryFn: () => client.get('/logistics/trips').then(r => r.data.data),
  });

  const d = dashboard || {};
  const recentTrips = (trips || []).slice(-10).reverse();

  const tripColumns: Column<any>[] = [
    { key: 'id', label: 'Trip #', render: (t: any) => `#${t.id}` },
    { key: 'destination', label: 'Destination', render: (t: any) => t.destination || t.route || '-' },
    { key: 'start_date', label: 'Date', render: (t: any) => t.start_date ? new Date(t.start_date).toLocaleDateString() : (t.start_time ? new Date(t.start_time).toLocaleDateString() : '-') },
    { key: 'status', label: 'Status' },
  ];

  return (
    <ModulePage title="Logistics Dashboard" subtitle="Overview of fleet and logistics operations">
      <div className="stats-grid">
        <StatsCard title="Total Vehicles" value={d.total_vehicles ?? 0} icon={Truck} color="#2563eb" />
        <StatsCard title="Total Drivers" value={d.total_drivers ?? 0} icon={Users} color="#16a34a" />
        <StatsCard title="Total Transport Requests" value={d.total_requests ?? 0} icon={ClipboardList} color="#d97706" />
        <StatsCard title="Total Trips" value={d.total_trips ?? 0} icon={Route} color="#8b5cf6" />
        <StatsCard title="Total Maintenance Records" value={d.total_maintenance ?? 0} icon={Wrench} color="#dc2626" />
        <StatsCard title="Total Deliveries" value={d.total_deliveries ?? 0} icon={Package} color="#ec4899" />
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Trips</h3>
          <DataTable columns={tripColumns} data={recentTrips} emptyMessage="No recent trips" />
        </div>
      </div>
    </ModulePage>
  );
}
