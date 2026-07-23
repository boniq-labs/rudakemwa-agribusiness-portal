import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Milk, Sun, Moon, TrendingUp, DollarSign, Package, ClipboardList } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import client from '../../api/client';
import DepartmentHeader from '../../components/DepartmentHeader';

function getCSSVar(name: string) {
  if (typeof document === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

interface DailyEntry {
  date: string;
  morning: number;
  evening: number;
  total: number;
}

export default function MilkDashboard() {
  const [date] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: reportData } = useQuery({
    queryKey: ['milk-dashboard', date],
    queryFn: () => client.get('/milk/reports', { params: { start_date: date, end_date: date } }).then(r => r.data.data),
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

  const { data: productsData } = useQuery({
    queryKey: ['milk-products-summary'],
    queryFn: () => client.get('/milk/products').then(r => r.data.data || []),
  });

  const { data: recentData } = useQuery({
    queryKey: ['milk-recent-collections'],
    queryFn: () => client.get('/milk/collections', { params: { limit: 5 } }).then(r => r.data.data || []),
  });

  const report = reportData || {};
  const todayDaily = Array.isArray(report.daily) ? report.daily[0] || {} : {};
  const totalToday = todayDaily.total || 0;
  const morningTotal = todayDaily.morning || 0;
  const eveningTotal = todayDaily.evening || 0;
  const avgPerAnimal = todayDaily.number_of_animals ? (totalToday / todayDaily.number_of_animals).toFixed(2) : '0.00';
  const { data: milkDashboard } = useQuery({
    queryKey: ['milk-dashboard-stats'],
    queryFn: () => client.get('/dashboard/milk').then(r => r.data.data),
  });
  const revenue = milkDashboard?.todayRevenue ?? 0;
  const products = Array.isArray(productsData) ? productsData : [];
  const recentCollections = Array.isArray(recentData) ? recentData : [];
  const totalProducts = products.reduce((s: number, p: any) => s + (p.quantity || 0), 0);

  const weeklyChart: { day: string; morning: number; evening: number; total: number }[] = (weeklyData || []).map((d: DailyEntry) => {
    const dt = new Date(d.date);
    const day = dt.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, morning: d.morning || 0, evening: d.evening || 0, total: d.total || 0 };
  });

  const barData = [
    { name: 'Morning', quantity: morningTotal },
    { name: 'Evening', quantity: eveningTotal },
  ];

  const recentColumns: Column<any>[] = [
    { key: 'collection_date', label: 'Date', render: (c: any) => c.collection_date ? new Date(c.collection_date).toLocaleDateString() : '-' },
    { key: 'time', label: 'Time', render: (c: any) => c.time === 'morning' ? 'AM' : 'PM' },
    { key: 'quantity_liters', label: 'Liters', render: (c: any) => `${c.quantity_liters} L` },
  ];

  return (
    <ModulePage title="Milk Dashboard" subtitle="Milk production overview">
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Today" value={`${totalToday} L`} icon={Milk} color="#3b82f6" />
        <StatsCard title="Morning" value={`${morningTotal} L`} icon={Sun} color="#eab308" />
        <StatsCard title="Evening" value={`${eveningTotal} L`} icon={Moon} color="#6366f1" />
        <StatsCard title="Avg / Animal" value={`${avgPerAnimal} L`} icon={TrendingUp} color="#22c55e" />
        <StatsCard title="Today's Revenue" value={`$${Number(revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="#10b981" />
        <StatsCard title="Products" value={products.length} icon={Package} color="#f59e0b" />
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Package size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Products Summary</h3>
          </div>
          {products.length === 0 ? (
            <p className="text-secondary" style={{ textAlign: 'center', padding: 24 }}>No products yet.</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Products</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{products.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Stock</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalProducts}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {products.slice(0, 5).map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{p.name}</span>
                    <span style={{ fontWeight: 600 }}>${p.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Collections</h3>
          </div>
          <DataTable columns={recentColumns} data={recentCollections} emptyMessage="No recent collections" />
        </div>
      </div>
    </ModulePage>
  );
}
