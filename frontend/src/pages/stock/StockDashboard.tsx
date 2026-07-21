import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import { stockAPI } from '../../api/endpoints';
import { Package, DollarSign, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Pill, Plus, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import DepartmentHeader from '../../components/DepartmentHeader';
import type { Column } from '../../components/DataTable';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function StockDashboard() {
  const navigate = useNavigate();

  const { data: lowStock } = useQuery({ queryKey: ['low-stock'], queryFn: () => stockAPI.getLowStock().then(r => r.data.data || []) });
  const { data: items } = useQuery({ queryKey: ['stock-items'], queryFn: () => stockAPI.getItems().then(r => r.data.data || []) });
  const { data: transactions } = useQuery({ queryKey: ['stock-transactions'], queryFn: () => stockAPI.getTransactions().then(r => r.data.data || []) });

  const totalItems = (items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);
  const totalValue = (items || []).reduce((s: number, i: any) => s + Number(i.quantity || 0) * Number(i.purchase_price || 0), 0);
  const lowStockCount = (lowStock || []).length;

  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = (transactions || []).filter((t: any) => t.date?.startsWith(today));
  const receivedToday = todayTransactions.filter((t: any) => t.type === 'receive').reduce((s: number, t: any) => s + Number(t.quantity || 0), 0);
  const issuedToday = todayTransactions.filter((t: any) => t.type === 'issue').reduce((s: number, t: any) => s + Number(t.quantity || 0), 0);

  const medicines = (items || []).filter((i: any) => i.category === 'Medicine' || i.category?.name === 'Medicine');
  const expiringSoon = medicines.filter((m: any) => {
    if (!m.expiry_date) return false;
    const diff = new Date(m.expiry_date).getTime() - Date.now();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  });

  const categoryMap: Record<string, number> = {};
  (items || []).forEach((i: any) => {
    const cat = typeof i.category === 'object' ? i.category?.name : i.category || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(i.quantity || 0);
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const monthlyMap: Record<string, { receive: number; issue: number }> = {};
  (transactions || []).forEach((t: any) => {
    const month = t.date ? t.date.substring(0, 7) : 'Unknown';
    if (!monthlyMap[month]) monthlyMap[month] = { receive: 0, issue: 0 };
    if (t.type === 'receive' || t.type === 'receiving') monthlyMap[month].receive += Number(t.quantity || 0);
    if (t.type === 'issue') monthlyMap[month].issue += Number(t.quantity || 0);
  });
  const barData = Object.entries(monthlyMap).sort().map(([month, vals]) => ({ month, ...vals }));

  const valueHistory = (transactions || []).filter((t: any) => t.total_value).map((t: any) => ({
    date: t.date || t.created_at,
    value: Number(t.total_value),
  })).sort((a: any, b: any) => a.date?.localeCompare(b.date || '')).slice(-30);

  const lowStockColumns: Column<any>[] = [
    { key: 'name', label: 'Item' },
    { key: 'quantity', label: 'On Hand' },
    { key: 'min_stock_level', label: 'Min Level' },
    { key: 'unit', label: 'Unit' },
  ];

  const quickActions = [
    { label: 'Receive Stock', icon: ArrowDownToLine, onClick: () => navigate('/stock/receiving'), color: '#2563eb' },
    { label: 'Issue Stock', icon: ArrowUpFromLine, onClick: () => navigate('/stock/issue'), color: '#16a34a' },
    { label: 'New Item', icon: Plus, onClick: () => navigate('/stock/inventory?add=true'), color: '#d97706' },
  ];

  return (
    <ModulePage title="Stock Dashboard" subtitle="Real-time stock management overview"
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
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Total Items" value={totalItems} icon={Package} color="#2563eb" />
        <StatsCard title="Total Value" value={totalValue.toLocaleString()} icon={DollarSign} color="#16a34a" />
        <StatsCard title="Low Stock Items" value={lowStockCount} icon={AlertTriangle} color="#dc2626" />
        <StatsCard title="Received Today" value={receivedToday} icon={ArrowDownToLine} color="#8b5cf6" />
        <StatsCard title="Issued Today" value={issuedToday} icon={ArrowUpFromLine} color="#ec4899" />
        <StatsCard title="Expiring Soon" value={expiringSoon.length} icon={Pill} color="#d97706" />
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-side">
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Low Stock Alerts</h3>
            {lowStock && lowStock.length > 0 ? (
              <DataTable columns={lowStockColumns} data={lowStock} />
            ) : (
              <p className="text-secondary">No low stock items</p>
            )}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 600 }}>Quick Actions</h3>
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

      <div className="dashboard-grid">
        <div className="card">
          <h3>Monthly Stock Movement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="receive" name="Received" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="issue" name="Issued" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Stock Value Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={valueHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ModulePage>
  );
}
