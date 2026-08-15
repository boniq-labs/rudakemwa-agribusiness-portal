import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, FlaskConical, DollarSign, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import client from '../../api/client';

interface DailyEntry {
  date: string;
  morning: number;
  evening: number;
  total: number;
  number_of_animals: number;
}

interface QualityEntry {
  id: number;
  fat_percentage: number;
  protein: number;
  quality_status: string;
}

interface WasteEntry {
  reason: string;
  quantity_liters: number;
}

export default function MilkReports() {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [startDate, setStartDate] = useState(weekAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: reportData, isLoading: dailyLoading } = useQuery({
    queryKey: ['milk-report', startDate, endDate],
    queryFn: () => client.get('/milk/reports', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data.data),
  });

  const report = reportData || {};
  const dailyReport: DailyEntry[] = report.daily || [];
  const qualityRecords: QualityEntry[] = report.quality || [];
  const wasteRecords: WasteEntry[] = report.waste || [];

  const totalMilk = dailyReport.reduce((s, d) => s + d.total, 0);
  const totalMorning = dailyReport.reduce((s, d) => s + d.morning, 0);
  const totalEvening = dailyReport.reduce((s, d) => s + d.evening, 0);

  const avgFat = qualityRecords.length > 0
    ? (qualityRecords.reduce((s, r) => s + r.fat_percentage, 0) / qualityRecords.length).toFixed(2)
    : '0.00';
  const avgProtein = qualityRecords.length > 0
    ? (qualityRecords.reduce((s, r) => s + r.protein, 0) / qualityRecords.length).toFixed(2)
    : '0.00';
  const excellent = qualityRecords.filter((r) => r.quality_status === 'excellent').length;
  const rejected = qualityRecords.filter((r) => r.quality_status === 'rejected').length;

  const revenue = (totalMilk * 0.85).toFixed(2);

  const wasteByReason: Record<string, number> = wasteRecords.reduce<Record<string, number>>((acc, r) => {
    const reason = r.reason || 'other';
    acc[reason] = (acc[reason] || 0) + r.quantity_liters;
    return acc;
  }, {});
  const totalWaste = Object.values(wasteByReason).reduce((s, v) => s + v, 0);

  const chartData = dailyReport.slice(-7).map((d: DailyEntry) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    morning: d.morning,
    evening: d.evening,
    total: d.total,
  }));
  const pieData = [
    { name: 'Morning', value: totalMorning },
    { name: 'Evening', value: totalEvening },
  ];
  const COLORS = ['#eab308', '#6366f1'];

  const dailyColumns: Column<DailyEntry>[] = [
    { key: 'date', label: 'Date' },
    { key: 'morning', label: 'Morning (L)', render: (d) => `${d.morning} L` },
    { key: 'evening', label: 'Evening (L)', render: (d) => `${d.evening} L` },
    { key: 'total', label: 'Total (L)', render: (d) => `${d.total} L` },
    { key: 'number_of_animals', label: 'Animals' },
  ];

  const exportCSV = (data: any[], filename: string, headers: string[]) => {
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => row[h] ?? '').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModulePage
      title="Milk Reports"
      subtitle="Daily milk production reports"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setStartDate(weekAgo.toISOString().split('T')[0]); setEndDate(today.toISOString().split('T')[0]); }}>
            Last 7 Days
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            const m = new Date(); m.setDate(m.getDate() - 30);
            setStartDate(m.toISOString().split('T')[0]); setEndDate(today.toISOString().split('T')[0]);
          }}>
            Last 30 Days
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Start Date</label>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">End Date</label>
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Production Report</h3>
            </div>
            <button className="btn btn-sm" onClick={() => exportCSV(dailyReport, 'production-report', ['date', 'morning', 'evening', 'total', 'number_of_animals'])}>
              <Download size={14} /> CSV
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Milk</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalMilk.toFixed(1)} L</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Morning</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalMorning.toFixed(1)} L</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evening</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalEvening.toFixed(1)} L</div>
            </div>
          </div>
          {chartData.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--text-secondary)" />
                  <Tooltip />
                  <Bar dataKey="morning" fill="#eab308" name="Morning" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="evening" fill="#6366f1" name="Evening" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <DataTable columns={dailyColumns} data={dailyReport} loading={dailyLoading} />
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Quality Report</h3>
            </div>
            <button className="btn btn-sm" onClick={() => exportCSV(qualityRecords, 'quality-report', ['id', 'fat_percentage', 'protein', 'quality_status'])}>
              <Download size={14} /> CSV
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Fat %</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{avgFat}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Protein</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{avgProtein}%</div>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Distribution: </span>
            <StatusBadge status="excellent" /> <strong>{excellent}</strong>
            <span style={{ margin: '0 8px' }}>|</span>
            <StatusBadge status="rejected" /> <strong>{rejected}</strong>
          </div>
          {qualityRecords.length > 0 && (
            <DataTable
              columns={[
                { key: 'id', label: 'Test ID', render: (r) => `#${r.id}` },
                { key: 'fat_percentage', label: 'Fat %', render: (r) => `${r.fat_percentage}%` },
                { key: 'protein', label: 'Protein', render: (r) => `${r.protein}%` },
                { key: 'quality_status', label: 'Status', render: (r) => <StatusBadge status={r.quality_status} /> },
              ]}
              data={qualityRecords.slice(0, 10)}
              loading={dailyLoading}
            />
          )}
        </div>
      </div>

      {pieData[0].value > 0 || pieData[1].value > 0 ? (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Morning vs Evening Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}L`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Sales Report</h3>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Milk Produced</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalMilk.toFixed(1)} L</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Est. Revenue</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>RWF {Number(revenue).toLocaleString()}</div>
            </div>
          </div>
          <p className="text-secondary" style={{ marginTop: 12, fontSize: '0.85rem' }}>
            Estimated revenue based on RWF 0.85 per liter (average milk price).
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Waste Report</h3>
            </div>
            <button className="btn btn-sm" onClick={() => exportCSV(
              Object.entries(wasteByReason).map(([reason, quantity]) => ({ reason, quantity_liters: quantity })),
              'waste-report', ['reason', 'quantity_liters']
            )}>
              <Download size={14} /> CSV
            </button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Waste</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalWaste.toFixed(1)} L</div>
          </div>
          {Object.entries(wasteByReason).length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Quantity (L)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(wasteByReason).map(([reason, qty]) => (
                  <tr key={reason}>
                    <td><StatusBadge status={reason} /></td>
                    <td>{qty.toFixed(1)} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-secondary" style={{ textAlign: 'center', padding: 24 }}>No waste recorded in this period.</p>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
