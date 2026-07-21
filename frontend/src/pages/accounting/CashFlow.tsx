import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Column } from '../../components/DataTable';

export default function CashFlow() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: cashFlow, isLoading } = useQuery({
    queryKey: ['accounting-cash-flow', dateFrom, dateTo],
    queryFn: () => client.get('/accounting/cash-flow', { params: { start_date: dateFrom, end_date: dateTo } }).then(r => r.data.data || r.data),
  });

  const entries = useMemo(() => {
    if (!cashFlow) return [];
    if (Array.isArray(cashFlow)) return cashFlow;
    if (cashFlow.entries) return cashFlow.entries;
    if (cashFlow.transactions) return cashFlow.transactions;
    const merged: any[] = [];
    if (cashFlow.inflows) {
      cashFlow.inflows.forEach((i: any) => merged.push({ ...i, date: i.date, description: i.category || 'Income', inflow: i.amount, outflow: 0 }));
    }
    if (cashFlow.outflows) {
      cashFlow.outflows.forEach((o: any) => merged.push({ ...o, date: o.date, description: o.category || 'Expense', inflow: 0, outflow: o.amount }));
    }
    merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return merged;
  }, [cashFlow]);

  const openingBalance = cashFlow?.opening_balance ?? 0;
  const closingBalance = useMemo(() => {
    if (cashFlow?.closing_balance !== undefined) return cashFlow.closing_balance;
    const totalIn = entries.reduce((s: number, e: any) => s + (Number(e.inflow || 0) || 0), 0);
    const totalOut = entries.reduce((s: number, e: any) => s + (Number(e.outflow || 0) || 0), 0);
    return totalIn - totalOut;
  }, [entries, cashFlow]);
  const totalInflow = useMemo(() => entries.reduce((s: number, e: any) => s + (Number(e.inflow || 0) || 0), 0), [entries]);
  const totalOutflow = useMemo(() => entries.reduce((s: number, e: any) => s + (Number(e.outflow || 0) || 0), 0), [entries]);

  const chartData = useMemo(() => {
    if (!entries.length) return [];
    let balance = Number(openingBalance) || 0;
    return entries.map((e: any) => {
      const inflow = Number(e.inflow || e.amount_in || 0) || 0;
      const outflow = Number(e.outflow || e.amount_out || 0) || 0;
      balance = balance + inflow - outflow;
      return { date: e.date || e.transaction_date || '', inflow, outflow, balance };
    });
  }, [entries, openingBalance]);

  const columns: Column<any>[] = [
    { key: 'date', label: 'Date', render: (e: any) => e.date ? new Date(e.date).toLocaleDateString() : '-' },
    { key: 'description', label: 'Description', render: (e: any) => e.description || e.notes || '-' },
    { key: 'inflow', label: 'Inflow', render: (e: any) => {
      const v = Number(e.inflow || e.amount_in || 0) || 0;
      return v > 0 ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatAmount(v)}</span> : '-';
    }},
    { key: 'outflow', label: 'Outflow', render: (e: any) => {
      const v = Number(e.outflow || e.amount_out || 0) || 0;
      return v > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatAmount(v)}</span> : '-';
    }},
    { key: 'balance', label: 'Balance', render: (e: any) => {
      const v = Number(e.balance || e.running_balance || 0) || 0;
      return <span style={{ fontWeight: 700, color: v >= 0 ? 'var(--text)' : 'var(--danger)' }}>{formatAmount(v)}</span>;
    }},
  ];

  return (
    <ModulePage title="Cash Flow" subtitle="Monitor cash movement">
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

      <div className="stats-grid">
        <StatsCard title="Opening Balance" value={formatAmount(Number(openingBalance) || 0)} icon={Wallet} color="var(--primary)" />
        <StatsCard title="Cash In" value={formatAmount(totalInflow)} icon={ArrowUpRight} color="var(--success)" />
        <StatsCard title="Cash Out" value={formatAmount(totalOutflow)} icon={ArrowDownRight} color="var(--danger)" />
        <StatsCard title="Closing Balance" value={formatAmount(Number(closingBalance) || 0)} icon={DollarSign} color={closingBalance >= 0 ? 'var(--success)' : 'var(--danger)'} />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Cash Flow Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip formatter={(v: any) => formatAmount(Number(v))} />
            <Area type="monotone" dataKey="inflow" stroke="var(--success)" fill="url(#inflowGrad)" name="Inflow" />
            <Area type="monotone" dataKey="outflow" stroke="var(--danger)" fill="url(#outflowGrad)" name="Outflow" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <DataTable columns={columns} data={entries} loading={isLoading} emptyMessage="No cash flow data found" />
    </ModulePage>
  );
}
