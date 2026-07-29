import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Milk, Sun, Moon, TrendingUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import DepartmentHeader from '../../components/DepartmentHeader';

function getCSSVar(name: string) {
  if (typeof document === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

export default function MilkDashboard() {
  const { data: dashboardData } = useQuery({
    queryKey: ['milk-dashboard-stats'],
    queryFn: () => client.get('/dashboard/milk').then(r => r.data.data || {}),
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['milk-weekly'],
    queryFn: async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const res = await client.get('/milk/reports', {
        params: { start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0] },
      });
      const d = res.data.data;
      return (d?.daily || []).reverse();
    },
  });

  const stats: any = dashboardData || {};
  const totalToday = Number(stats.milkToday) || 0;
  const morningTotal = Number(stats.morningCollection) || 0;
  const eveningTotal = Number(stats.eveningCollection) || 0;
  const avgPerAnimal = Number(stats.averagePerCow) || 0;

  const weeklyChart: { day: string; total: number }[] = (weeklyData || []).map((d: any) => {
    const dt = new Date(d.date);
    const day = dt.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, total: d.total || 0 };
  });

  const barData = [
    { name: 'Morning', quantity: morningTotal },
    { name: 'Evening', quantity: eveningTotal },
  ];

  return (
    <ModulePage title="Milk Dashboard" subtitle="Milk production overview">
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Today" value={`${totalToday.toFixed(1)} L`} icon={Milk} color="#3b82f6" />
        <StatsCard title="Morning" value={`${morningTotal.toFixed(1)} L`} icon={Sun} color="#eab308" />
        <StatsCard title="Evening" value={`${eveningTotal.toFixed(1)} L`} icon={Moon} color="#6366f1" />
        <StatsCard title="Avg / Animal" value={`${avgPerAnimal.toFixed(2)} L`} icon={TrendingUp} color="#22c55e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Daily Production Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyChart}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={getCSSVar('--border')} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke={getCSSVar('--text-secondary')} />
              <YAxis tick={{ fontSize: 12 }} stroke={getCSSVar('--text-secondary')} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Morning vs Evening</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={getCSSVar('--border')} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={getCSSVar('--text-secondary')} />
              <YAxis tick={{ fontSize: 12 }} stroke={getCSSVar('--text-secondary')} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ModulePage>
  );
}
