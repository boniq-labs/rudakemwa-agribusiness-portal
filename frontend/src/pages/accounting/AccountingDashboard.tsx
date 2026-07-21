import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DepartmentHeader from '../../components/DepartmentHeader';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle, Plus, FileText, Receipt, ArrowRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatAmount } from '../../services/currency';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AccountingDashboard() {
  const navigate = useNavigate();

  const { data: dash } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: () => client.get('/accounting/dashboard').then(r => r.data.data || r.data),
  });

  const monthIncome = dash?.monthIncome ?? dash?.monthlyIncome ?? 0;
  const monthExpenses = dash?.monthExpenses ?? dash?.monthlyExpenses ?? 0;
  const recentTransactions = dash?.recentTransactions || dash?.recent || [];
  const incomeVsExpenses = dash?.incomeVsExpenses || [];
  const expenseByCategory = dash?.expenseByCategory || [];

  const netProfit = monthIncome - monthExpenses;

  return (
    <ModulePage
      title="Accounting Dashboard"
      subtitle="Financial overview and key metrics"
      actions={
        <>
          <button className="btn btn-primary" onClick={() => navigate('/accounting/income?add=true')}>
            <Plus size={16} /> Record Income
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/accounting/expenses?add=true')}>
            <Receipt size={16} /> Record Expense
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/accounting/invoices?add=true')}>
            <FileText size={16} /> Create Invoice
          </button>
        </>
      }
    >
      <DepartmentHeader />
      <div className="stats-grid">
        <StatsCard title="Monthly Income" value={formatAmount(monthIncome)} icon={TrendingUp} color="var(--primary)" />
        <StatsCard title="Monthly Expenses" value={formatAmount(monthExpenses)} icon={TrendingDown} color="var(--danger)" />
        <StatsCard title="Net Profit" value={formatAmount(netProfit)} icon={Wallet} color={netProfit >= 0 ? 'var(--success)' : 'var(--danger)'} />
        <StatsCard title="Pending Payments" value={dash?.pendingInvoices ?? 0} icon={Clock} color="var(--warning)" />
        <StatsCard title="Outstanding" value={formatAmount(dash?.outstanding ?? 0)} icon={AlertTriangle} color="var(--danger)" />
        <StatsCard title="Cash Balance" value={formatAmount(dash?.cashBalance ?? 0)} icon={DollarSign} color="var(--success)" />
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card chart-card">
            <h3>Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip formatter={(v: any) => formatAmount(Number(v))} />
                <Bar dataKey="income" fill="var(--success)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ marginTop: 20 }}>
            <h3>Profit Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={incomeVsExpenses.map((m: any) => ({ month: m.month, profit: (m.income || 0) - (m.expenses || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip formatter={(v: any) => formatAmount(Number(v))} />
                <Line type="monotone" dataKey="profit" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-side">
          <div className="card">
            <h3>Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }: any) => name}>
                  {expenseByCategory.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatAmount(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Recent Transactions</h3>
            <div style={{ padding: 0 }}>
              {recentTransactions.length === 0 ? (
                <p className="text-secondary" style={{ padding: 16, textAlign: 'center' }}>No recent transactions</p>
              ) : (
                recentTransactions.slice(0, 5).map((t: any, i: number) => (
                  <div key={t.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', margin: '0 16px', borderBottom: i < Math.min(recentTransactions.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.description || t.category || t.source || 'Transaction'}</div>
                      <small className="text-secondary">{t.date ? new Date(t.date).toLocaleDateString() : ''}</small>
                    </div>
                    <span style={{ fontWeight: 600, color: t.type === 'income' || t.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatAmount(Math.abs(Number(t.amount) || 0))}
                    </span>
                  </div>
                ))
              )}
              {recentTransactions.length > 5 && (
                <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button className="btn btn-sm" onClick={() => navigate('/accounting/income')}>
                    View All <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
