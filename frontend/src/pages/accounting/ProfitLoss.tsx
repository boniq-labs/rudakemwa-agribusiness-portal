import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProfitLoss() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: pl, isLoading } = useQuery({
    queryKey: ['accounting-profit-loss', dateFrom, dateTo],
    queryFn: () => client.get('/accounting/profit-loss', { params: { start_date: dateFrom, end_date: dateTo } }).then(r => r.data.data || r.data),
  });

  const incomeSources = useMemo(() => {
    if (!pl) return [];
    return pl.income_sources || pl.income || [];
  }, [pl]);

  const expenseCategories = useMemo(() => {
    if (!pl) return [];
    return pl.expense_categories || pl.expenses || [];
  }, [pl]);

  const totalIncome = useMemo(() => incomeSources.reduce((s: number, i: any) => s + (Number(i.total || i.amount) || 0), 0), [incomeSources]);
  const totalExpenses = useMemo(() => expenseCategories.reduce((s: number, e: any) => s + (Number(e.total || e.amount) || 0), 0), [expenseCategories]);
  const netProfit = totalIncome - totalExpenses;

  const pieData = useMemo(() => [
    { name: 'Income', value: totalIncome },
    { name: 'Expenses', value: totalExpenses },
  ], [totalIncome, totalExpenses]);

  return (
    <ModulePage title="Profit & Loss" subtitle="Profit and loss statement">
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className="card">
              <h3 style={{ color: 'var(--success)', marginBottom: 16 }}>Income</h3>
              {incomeSources.length === 0 ? (
                <p className="text-secondary">No income recorded</p>
              ) : (
                <>
                  {incomeSources.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < incomeSources.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span>{item.source || item.name || item.category || '-'}</span>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatAmount(Number(item.total || item.amount) || 0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 8, borderTop: '2px solid var(--success)', fontWeight: 700 }}>
                    <span>Total Income</span>
                    <span style={{ color: 'var(--success)' }}>{formatAmount(totalIncome)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: 16 }}>Expenses</h3>
              {expenseCategories.length === 0 ? (
                <p className="text-secondary">No expenses recorded</p>
              ) : (
                <>
                  {expenseCategories.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < expenseCategories.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span>{item.category || item.name || item.source || '-'}</span>
                      <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatAmount(Number(item.total || item.amount) || 0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: 8, borderTop: '2px solid var(--danger)', fontWeight: 700 }}>
                    <span>Total Expenses</span>
                    <span style={{ color: 'var(--danger)' }}>{formatAmount(totalExpenses)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="card" style={{ marginTop: 20, background: netProfit >= 0 ? 'rgba(22, 163, 74, 0.05)' : 'rgba(220, 38, 38, 0.05)', border: `2px solid ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Net Profit / Loss</h3>
                  <p className="text-secondary" style={{ margin: '4px 0 0' }}>Income - Expenses</p>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatAmount(netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <h3>Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name}: ${formatAmount(value)}`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? 'var(--success)' : 'var(--danger)'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatAmount(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h3>Summary</h3>
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-secondary">Period</span>
                  <span style={{ fontWeight: 500 }}>{dateFrom} to {dateTo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-secondary">Total Income</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{formatAmount(totalIncome)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-secondary">Total Expenses</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatAmount(totalExpenses)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span className="text-secondary">Net</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatAmount(netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
