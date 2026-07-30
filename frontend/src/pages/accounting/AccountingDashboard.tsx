import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DepartmentHeader from '../../components/DepartmentHeader';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { TrendingUp, TrendingDown, FileText, Plus, Receipt } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatAmount } from '../../services/currency';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AccountingDashboard() {
  const navigate = useNavigate();

  const { data: dash } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: () => client.get('/accounting/dashboard').then(r => r.data.data || r.data),
  });

  const totalMonthlyIncome = dash?.totalMonthlyIncome ?? 0;
  const totalMonthlyExpenses = dash?.totalMonthlyExpenses ?? 0;
  const totalInvoices = dash?.totalInvoices ?? 0;
  const profit = dash?.profit ?? (totalMonthlyIncome - totalMonthlyExpenses);
  const incomeVsExpenses = dash?.incomeVsExpenses || [];
  const expenseByCategory = dash?.expenseByCategory || [];

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
        <StatsCard title="Total Monthly Income" value={formatAmount(totalMonthlyIncome)} icon={TrendingUp} color="var(--success)" />
        <StatsCard title="Total Monthly Expenses" value={formatAmount(totalMonthlyExpenses)} icon={TrendingDown} color="var(--danger)" />
        <StatsCard title="Total Invoices" value={totalInvoices} icon={FileText} color="var(--primary)" />
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card chart-card">
            <h3>Income vs Expenses (6 months)</h3>
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
            <h3>Monthly Expense Breakdown</h3>
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
            <h3>Net Profit</h3>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatAmount(profit)}
              </div>
              <div className="text-secondary">Current Month</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '16px 0', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--success)' }}>{formatAmount(totalMonthlyIncome)}</div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Income</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatAmount(totalMonthlyExpenses)}</div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Expenses</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600 }}>{totalInvoices}</div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Invoices</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
