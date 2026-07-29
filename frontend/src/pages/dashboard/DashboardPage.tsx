import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api';
import client from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { formatAmount } from '../../services/currency';
import {
  Users, PawPrint, Milk, TrendingUp, TrendingDown,
  Bell, Clock, UserCircle,
  ArrowRight, Sprout, UserPlus,
} from 'lucide-react';
import type { FC } from 'react';

interface DeptLink { label: string; path: string; }
interface DeptDef {
  key: string; label: string; icon: FC<{ size?: number; className?: string }>;
  path: string; color: string; roles: string[];
  links: DeptLink[];
  stats: (o: any) => { label: string; value: string | number }[];
}

const DEPARTMENTS: DeptDef[] = [
  {
    key: 'hr', label: 'Human Resources', icon: UserCircle, path: '/hr/dashboard', color: '#2563eb',
    roles: ['owner', 'admin', 'hr'],
    links: [{ label: 'Employees', path: '/hr/employees' }, { label: 'Attendance', path: '/hr/attendance' }, { label: 'Reports', path: '/hr/reports' }, { label: 'Recruitment', path: '/hr/recruitment' }],
    stats: (o) => [
      { label: 'Employees', value: o?.hr?.employees ?? 0 },
      { label: 'Present', value: o?.hr?.presentToday ?? 0 },
      { label: 'Pending Leaves', value: o?.hr?.pendingLeaves ?? 0 },
    ],
  },
  {
    key: 'crops', label: 'Crop Production', icon: Sprout, path: '/crops/dashboard', color: '#65a30d',
    roles: ['owner', 'admin', 'crops'],
    links: [{ label: 'Crop Types', path: '/crops/types' }, { label: 'Land Areas', path: '/crops/land' }, { label: 'Activities', path: '/crops/activities' }, { label: 'Reports', path: '/crops/reports' }],
    stats: (o) => [
      { label: 'Crop Types', value: o?.crops?.totalCropTypes ?? 0 },
      { label: 'Land Areas', value: o?.crops?.totalLandAreas ?? 0 },
      { label: 'Planted', value: o?.crops?.planted ?? 0 },
    ],
  },
  {
    key: 'milk', label: 'Milk Production', icon: Milk, path: '/milk/dashboard', color: '#d97706',
    roles: ['owner', 'admin', 'milk'],
    links: [{ label: 'Morning', path: '/milk/morning' }, { label: 'Evening', path: '/milk/evening' }, { label: 'Reports', path: '/milk/reports' }],
    stats: (o) => [
      { label: 'Today (L)', value: o?.milk?.today ?? 0 },
      { label: 'Morning (L)', value: o?.milk?.morning ?? 0 },
      { label: 'Evening (L)', value: o?.milk?.evening ?? 0 },
    ],
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role === 'farm_owner' ? 'owner' : (user?.role || 'owner');

  const { data: main, isLoading: mainLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const r = await dashboardApi.get(); return r.data.data; },
    refetchOnMount: true,
    staleTime: 0,
  });
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => { const r = await dashboardApi.overview(); return r.data.data; },
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: latestEmployees } = useQuery({
    queryKey: ['latest-employees'],
    queryFn: () => client.get('/dashboard/latest-employees').then(r => r.data.data || r.data),
    enabled: role === 'owner' || role === 'admin',
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: latestAnimals } = useQuery({
    queryKey: ['latest-animals'],
    queryFn: () => client.get('/dashboard/latest-animals').then(r => r.data.data || r.data),
    enabled: role === 'owner' || role === 'admin',
    refetchOnMount: true,
    staleTime: 0,
  });

  const isLoading = mainLoading || ovLoading;
  const visibleDepts = DEPARTMENTS.filter((d) => d.roles.includes(role));

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-secondary">{ROLE_LABELS[role] || role}</p>
          </div>
        </header>
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (<div key={i} className="stat-card skeleton" />))}
        </div>
        <div className="dept-grid">
          {[...Array(6)].map((_, i) => (<div key={i} className="dept-card skeleton" />))}
        </div>
      </div>
    );
  }

  const showKpis = role === 'owner' || role === 'admin' || role === 'farm_owner';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.firstName}!</h1>
          <p className="text-secondary">{ROLE_LABELS[role] || role} Dashboard</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/settings" className="btn btn-outline">Quick Settings</Link>
        </div>
      </header>

      {showKpis && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><Users /></div>
            <div className="stat-info"><div className="stat-value">{main?.totalEmployees ?? main?.totalUsers ?? 0}</div><div className="stat-label">Total Employees</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><PawPrint /></div>
            <div className="stat-info"><div className="stat-value">{main?.totalAnimals ?? 0}</div><div className="stat-label">Total Animals</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ecfccb', color: '#65a30d' }}><Sprout /></div>
            <div className="stat-info"><div className="stat-value">{overview?.crops?.totalCropTypes ?? (main?.totalCropTypes ?? 0)}</div><div className="stat-label">Total Crops</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Milk /></div>
            <div className="stat-info"><div className="stat-value">{main?.milkToday ?? 0}L</div><div className="stat-label">Milk Today</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><TrendingUp /></div>
            <div className="stat-info"><div className="stat-value">{formatAmount(Number(main?.monthlyIncome ?? 0))}</div><div className="stat-label">Monthly Income</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><TrendingDown /></div>
            <div className="stat-info"><div className="stat-value">{formatAmount(Number(main?.monthlyExpenses ?? 0))}</div><div className="stat-label">Monthly Expenses</div></div>
          </div>
        </div>
      )}

      <h2 className="section-title">Departments</h2>
      <div className="dept-grid">
        {visibleDepts.map((dept) => {
          const Icon = dept.icon;
          const stats = dept.stats(overview);
          return (
            <div className="dept-card" key={dept.key}>
              <Link to={dept.path} className="dept-card-head">
                <div className="dept-icon" style={{ background: `${dept.color}20`, color: dept.color }}><Icon size={22} /></div>
                <div className="dept-name">{dept.label}</div>
                <ArrowRight size={16} className="dept-arrow" />
              </Link>
              <div className="dept-stats">
                {stats.map((s, i) => (
                  <div className="dept-stat" key={i}>
                    <div className="dept-stat-value">{s.value}</div>
                    <div className="dept-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="dept-links">
                {dept.links.map((l) => (
                  <Link key={l.path} to={l.path} className="dept-link">{l.label}</Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Revenue Summary</h3>
          <div className="revenue-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Monthly Income</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>
                {main?.monthlyIncome != null ? formatAmount(main.monthlyIncome) : '0'}
              </div>
            </div>
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Monthly Expenses</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>
                {main?.monthlyExpenses != null ? formatAmount(main.monthlyExpenses) : '0'}
              </div>
            </div>
            </div>
        </div>

        <div className="dashboard-side">
          <div className="card">
            <h3>Recent Notifications</h3>
            <div className="notif-list">
              {(!main?.notifications || main.notifications.length === 0) && (<p className="text-secondary">No notifications</p>)}
              {main?.notifications?.map((n: any) => (
                <div key={n.id} className="notif-item">
                  <Bell size={16} />
                  <div>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-time">{new Date(n.created_at || n.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>My Tasks</h3>
            <div className="task-list">
              {(!main?.tasks || main.tasks.length === 0) && (<p className="text-secondary">No pending tasks</p>)}
              {main?.tasks?.map((t: any) => (
                <div key={t.id} className="task-item">
                  <div className={`task-priority ${t.priority}`} />
                  <div>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">{t.dueDate && <>Due: {new Date(t.dueDate).toLocaleDateString()}</>}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(role === 'owner' || role === 'admin' || role === 'farm_owner') && main?.recentActivities && main.recentActivities.length > 0 && (
            <div className="card">
              <h3>Recent Activity</h3>
              <div className="task-list">
                {main.recentActivities.map((a: any, i: number) => (
                  <div key={i} className="task-item">
                    <Clock size={16} />
                    <div>
                      <div className="task-title">{a.action}</div>
                      <div className="task-meta">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {latestEmployees && latestEmployees.length > 0 && (
            <div className="card">
              <h3><UserPlus size={16} /> Latest Employees</h3>
              <div className="task-list">
                {latestEmployees.slice(0, 5).map((e: any) => (
                  <div key={e.id} className="task-item">
                    <UserCircle size={16} />
                    <div>
                      <div className="task-title">{e.first_name} {e.last_name}</div>
                      <div className="task-meta">{e.department_name || e.position || 'New hire'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {latestAnimals && latestAnimals.length > 0 && (
            <div className="card">
              <h3><PawPrint size={16} /> Latest Animals</h3>
              <div className="task-list">
                {latestAnimals.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="task-item">
                    <PawPrint size={16} />
                    <div>
                      <div className="task-title">{a.name || a.tag_id || `Animal #${a.id}`}</div>
                      <div className="task-meta">{a.breed_name || a.category_name || a.species || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
