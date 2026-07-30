import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { Download, BarChart3, PieChart, FileText, Receipt } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function AccountingReports() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const { data: reportData } = useQuery({
    queryKey: ['accounting-reports', dateFrom, dateTo],
    queryFn: () => client.get('/accounting/reports', { params: { start_date: dateFrom, end_date: dateTo } }).then(r => r.data.data || r.data),
  });

  const incomeBySource = reportData?.incomeBySource || {};
  const expenseByCategory = reportData?.expenseByCategory || {};

  const incomeColumns: Column<any>[] = [
    { key: 'source', label: 'Source' },
    { key: 'total', label: 'Total', render: (r: any) => formatAmount(r.total) },
  ];

  const expenseColumns: Column<any>[] = [
    { key: 'category', label: 'Category' },
    { key: 'total', label: 'Total', render: (r: any) => formatAmount(r.total) },
  ];

  const incomeData = Object.entries(incomeBySource).map(([source, total]) => ({ source, total: total as number }));

  const expenseData = Object.entries(expenseByCategory).map(([category, total]) => ({ category, total: total as number }));

  const handleExport = (label: string) => {
    const rows = activeReport === 'income' ? incomeData.map(r => `${r.source},${r.total}`) :
                activeReport === 'expense' ? expenseData.map(r => `${r.category},${r.total}`) : [];
    const header = activeReport === 'income' ? 'Source,Total' : 'Category,Total';
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label.replace(/\s+/g, '-').toLowerCase()}-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalIncome = Object.values(incomeBySource).reduce((s: number, v: unknown) => s + (v as number), 0);
  const totalExpenses = Object.values(expenseByCategory).reduce((s: number, v: unknown) => s + (v as number), 0);
  const net = totalIncome - totalExpenses;

  const reports = [
    {
      id: 'income',
      label: 'Income Report',
      icon: BarChart3,
      color: 'var(--success)',
      summary: `${incomeData.length} sources · Total: ${formatAmount(totalIncome)}`,
    },
    {
      id: 'expense',
      label: 'Expense Report',
      icon: PieChart,
      color: 'var(--danger)',
      summary: `${expenseData.length} categories · Total: ${formatAmount(totalExpenses)}`,
    },
    {
      id: 'financial',
      label: 'Financial Statements',
      icon: FileText,
      color: 'var(--primary)',
      summary: `P&L: ${formatAmount(net)} · Cash Flow available`,
    },
    {
      id: 'tax',
      label: 'Tax Report',
      icon: Receipt,
      color: 'var(--warning)',
      summary: 'Tax summary based on recorded transactions',
    },
  ];

  return (
    <ModulePage title="Accounting Reports" subtitle="Financial reports and summaries">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {reports.map(report => (
          <div
            key={report.id}
            className="card"
            style={{ cursor: 'pointer', border: activeReport === report.id ? `2px solid ${report.color}` : '1px solid var(--border)' }}
            onClick={() => setActiveReport(activeReport === report.id ? null : report.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ background: `${report.color}20`, color: report.color, padding: 10, borderRadius: 10 }}>
                <report.icon size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{report.label}</div>
                <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{report.summary}</div>
              </div>
            </div>
            {activeReport === report.id && (
              <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleExport(report.label); }} style={{ width: '100%' }}>
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        ))}
      </div>

      {activeReport === 'income' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h3>Income by Source</h3>
            <button className="btn btn-sm" onClick={() => handleExport('Income Report')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={incomeColumns} data={incomeData} emptyMessage="No income data" />
        </div>
      )}

      {activeReport === 'expense' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h3>Expense by Category</h3>
            <button className="btn btn-sm" onClick={() => handleExport('Expense Report')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={expenseColumns} data={expenseData} emptyMessage="No expense data" />
        </div>
      )}

      {activeReport === 'financial' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Financial Statements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Total Income</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>{formatAmount(totalIncome)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Total Expenses</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--danger)' }}>{formatAmount(totalExpenses)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Net Profit</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatAmount(net)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => handleExport('Financial-Statements')}>
              <Download size={14} /> Export Summary
            </button>
          </div>
        </div>
      )}

      {activeReport === 'tax' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Tax Report</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Taxable Income</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatAmount(totalIncome)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Taxable Expenses</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatAmount(totalExpenses)}</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="text-secondary">Net Taxable</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatAmount(net)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => handleExport('Tax-Report')}>
              <Download size={14} /> Export Tax Report
            </button>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
