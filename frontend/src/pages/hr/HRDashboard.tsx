import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import { Users, UserCheck, Clock, Plus, ClipboardCheck } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usersAPI, attendanceAPI } from '../../api/endpoints';
import { useNavigate } from 'react-router-dom';
import DepartmentHeader from '../../components/DepartmentHeader';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function HRDashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
  });

  const { data: attendance } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => attendanceAPI.getAll({ date: today }).then(r => r.data.data),
  });

  const total = users?.length || 0;
  const present = attendance?.filter((a: any) => a.status === 'present').length || 0;
  const absent = total - present;

  const growthData = useMemo(() => {
    if (!users) return [];
    const map: Record<string, number> = {};
    users.forEach((u: any) => {
      if (u.created_at) {
        const m = u.created_at.substring(0, 7);
        map[m] = (map[m] || 0) + 1;
      }
    });
    let cum = 0;
    return Object.entries(map).sort().map(([month, count]) => {
      cum += count;
      return { month, employees: cum };
    });
  }, [users]);

  const deptData = useMemo(() => {
    if (!users) return [];
    const map: Record<string, number> = {};
    users.forEach((u: any) => {
      const d = typeof u.department === 'object' ? u.department?.name : u.department || 'Unassigned';
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  const statusCounts = useMemo(() => {
    if (!attendance) return [];
    const map: Record<string, number> = {};
    attendance.forEach((a: any) => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [attendance]);

  const recent = users?.slice(-5).reverse() || [];

  return (
    <ModulePage
      title="HR Dashboard"
      subtitle="Overview of human resources metrics"
      actions={
        <>
          <button className="btn btn-primary" onClick={() => navigate('/hr/employees?add=true')}>
            <Plus size={16} /> Add Employee
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/hr/attendance')}>
            <ClipboardCheck size={16} /> Record Attendance
          </button>
        </>
      }
    >
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Employees" value={total} icon={Users} color="var(--primary)" />
        <StatsCard title="Present Today" value={present} icon={UserCheck} color="var(--success)" />
        <StatsCard title="Absent Today" value={absent} icon={Clock} color="var(--warning)" />
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card chart-card">
            <h3>Employee Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="employees" stroke="var(--primary)" fill="url(#empGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Today's Attendance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="status" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-side">
          <div className="card">
            <h3>Employees by Department</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Recent Employees</h3>
            {recent.length === 0 && <p className="text-secondary">No employees yet</p>}
            <div className="notif-list">
              {recent.map((u: any) => (
                <div key={u.id} className="notif-item">
                  <div>
                    <div className="notif-title">{u.first_name} {u.last_name}</div>
                    <div className="notif-message">{u.employee_code || u.email} &mdash; {typeof u.department === 'object' ? u.department?.name : u.department}</div>
                    <div className="notif-time">{u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
