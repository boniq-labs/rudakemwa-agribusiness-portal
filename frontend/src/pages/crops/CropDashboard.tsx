import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import client from '../../api/client';
import { Sprout, MapPin, Wheat, Activity, ArrowRight } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function CropDashboard() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['crops-dashboard'],
    queryFn: () => client.get('/crops/dashboard').then(r => r.data.data),
  });

  const { data: activities } = useQuery({
    queryKey: ['crops-recent-activities'],
    queryFn: () => client.get('/crops/activities').then(r => r.data.data),
  });

  const d = dashboard || {};
  const recentActivities = (activities || []).slice(-10).reverse();

  const activityColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (a: any) => a.crop_name || a.crop_type_id },
    { key: 'land_name', label: 'Land', render: (a: any) => a.land_name || a.land_area_id },
    { key: 'planting_date', label: 'Planted', render: (a: any) => a.planting_date ? new Date(a.planting_date).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status' },
    { key: 'quantity_harvested', label: 'Harvested', render: (a: any) => a.quantity_harvested || 0 },
  ];

  const quickActions = [
    { label: 'New Crop Type', icon: Sprout, onClick: () => navigate('/crops/types?add=true'), color: '#16a34a' },
    { label: 'New Land Area', icon: MapPin, onClick: () => navigate('/crops/land?add=true'), color: '#2563eb' },
    { label: 'New Activity', icon: Activity, onClick: () => navigate('/crops/activities?add=true'), color: '#d97706' },
  ];

  return (
    <ModulePage title="Crop Dashboard" subtitle="Overview of crop production"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {quickActions.map((action, i) => (
            <button key={i} className="btn btn-primary btn-sm" onClick={action.onClick} style={{ background: action.color }}>
              <action.icon size={16} /> {action.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Total Crops" value={d.totalCrops ?? d.total_crops ?? 0} icon={Sprout} color="#16a34a" />
        <StatsCard title="Land Areas" value={d.totalLand ?? d.total_land_areas ?? 0} icon={MapPin} color="#2563eb" />
        <StatsCard title="Planted" value={d.totalPlanted ?? d.total_planted ?? 0} icon={Sprout} color="#d97706" />
        <StatsCard title="Harvested" value={d.totalHarvested ?? d.total_harvested ?? 0} icon={Wheat} color="#8b5cf6" />
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Activities</h3>
          <DataTable columns={activityColumns} data={recentActivities} emptyMessage="No recent activities" />
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
