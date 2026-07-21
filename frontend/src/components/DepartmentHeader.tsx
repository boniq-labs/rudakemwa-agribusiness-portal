import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';
import { Building2, Users, ListTodo, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

export default function DepartmentHeader() {
  const { user } = useAuth();
  const { data: dashData } = useQuery({
    queryKey: ['dashboard-header'],
    queryFn: async () => (await dashboardApi.get()).data.data,
    staleTime: 60000,
  });

  const info = dashData?.departmentInfo;
  if (!info?.departmentName && !info?.managerName && !info?.employeeCount) return null;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginBottom: 24,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary)20', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</div>
          <div style={{ fontWeight: 600 }}>{info.departmentName || ROLE_LABELS[user?.role || ''] || 'Dashboard'}</div>
        </div>
      </div>

      {info.managerName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--success)20', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manager</div>
            <div style={{ fontWeight: 600 }}>{info.managerName}</div>
          </div>
        </div>
      )}

      {info.employeeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--warning)20', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employees</div>
            <div style={{ fontWeight: 600 }}>{info.employeeCount}</div>
          </div>
        </div>
      )}

      {dashData?.tasks?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--info)20', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ListTodo size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Tasks</div>
            <div style={{ fontWeight: 600 }}>{dashData.tasks.length}</div>
          </div>
        </div>
      )}

      {dashData?.notifications?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--danger)20', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notifications</div>
            <div style={{ fontWeight: 600 }}>{dashData.notifications.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
