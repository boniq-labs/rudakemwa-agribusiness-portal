import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import client from '../../api/client';
import { Truck, Route, Users, Wrench, CalendarCheck, ArrowRight } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function LogisticsDashboard() {
  const navigate = useNavigate();

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

  const quickActions = [
    { label: 'New Trip', icon: Route, onClick: () => navigate('/logistics/trips?add=true'), color: '#2563eb' },
    { label: 'Add Vehicle', icon: Truck, onClick: () => navigate('/logistics/vehicles?add=true'), color: '#16a34a' },
    { label: 'Add Driver', icon: Users, onClick: () => navigate('/logistics/drivers?add=true'), color: '#d97706' },
    { label: 'Schedule Maintenance', icon: Wrench, onClick: () => navigate('/logistics/maintenance?add=true'), color: '#dc2626' },
  ];

  return (
    <ModulePage title="Logistics Dashboard" subtitle="Overview of fleet and logistics operations"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/logistics/trips?add=true')}>
            <CalendarCheck size={16} /> New Trip
          </button>
        </div>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Active Transports" value={d.active_transports ?? 0} icon={Route} color="#2563eb" />
        <StatsCard title="Available Vehicles" value={d.available_vehicles ?? 0} icon={Truck} color="#16a34a" />
        <StatsCard title="Active Drivers" value={d.active_drivers ?? 0} icon={Users} color="#d97706" />
        <StatsCard title="Pending Maintenance" value={d.pending_maintenance ?? 0} icon={Wrench} color="#dc2626" />
        <StatsCard title="Trips Today" value={d.trips_today ?? 0} icon={CalendarCheck} color="#8b5cf6" />
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Trips</h3>
          <DataTable columns={tripColumns} data={recentTrips} emptyMessage="No recent trips" />
        </div>
        <div className="dashboard-side">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map((action, i) => (
                <button key={i} onClick={action.onClick}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = action.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}20`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <action.icon size={18} />
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{action.label}</span>
                  <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
