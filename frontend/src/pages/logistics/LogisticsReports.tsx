import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import client from '../../api/client';
import { Truck, Package, Fuel, Users, Download } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#8b5cf6', '#ec4899'];

export default function LogisticsReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const dateParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const { data: reports } = useQuery({
    queryKey: ['logistics-reports', dateParams],
    queryFn: () => client.get('/logistics/reports', { params: dateParams }).then(r => r.data.data || r.data),
  });

  const r = reports || {};

  const vehicleStatusData = useMemo(() => {
    const data = r.vehicle_status || r.vehicles || [];
    if (Array.isArray(data)) return data;
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [r]);

  const totalTrips = r.total_trips ?? r.trips ?? 0;
  const fuelConsumption = r.fuel_consumption ?? r.fuel?.total_qty ?? r.fuel?.total_liters ?? 0;
  const fuelCost = r.fuel_cost ?? r.fuel?.total_cost ?? 0;

  const handleExport = () => {
    if (!r) return;
    const csv = [
      'Metric,Value',
      `Total Trips,${totalTrips}`,
      `Fuel Consumption,${fuelConsumption}`,
      `Fuel Cost,${fuelCost}`,
      ...(Array.isArray(vehicleStatusData) ? vehicleStatusData.map((v: any) => `${v.name || v.label},${v.value}`) : []),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModulePage
      title="Logistics Reports"
      subtitle="Analytics and reporting for logistics operations"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
          </div>
          {(dateFrom || dateTo) && (
            <button className="btn btn-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          )}
          <button className="btn btn-sm btn-primary" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Truck size={18} /> Trips Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="stat-label">Total Trips</div>
              <div className="stat-value">{totalTrips}</div>
            </div>
            <div>
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{r.completed_trips ?? '-'}</div>
            </div>
            <div>
              <div className="stat-label">In Progress</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{r.in_progress_trips ?? '-'}</div>
            </div>
            <div>
              <div className="stat-label">Scheduled</div>
              <div className="stat-value">{r.scheduled_trips ?? '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Fuel size={18} /> Fuel Report
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="stat-label">Total Consumption</div>
              <div className="stat-value">{fuelConsumption} L</div>
            </div>
            <div>
              <div className="stat-label">Total Cost</div>
              <div className="stat-value">{fuelCost.toLocaleString()}</div>
            </div>
            <div>
              <div className="stat-label">Avg Cost/L</div>
              <div className="stat-value">{fuelConsumption > 0 ? (fuelCost / fuelConsumption).toFixed(2) : '-'}</div>
            </div>
            <div>
              <div className="stat-label">Records</div>
              <div className="stat-value">{r.fuel_records ?? r.fuel?.count ?? '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
              <Package size={18} /> Delivery Status
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div className="stat-label">Delivered</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{r.delivered ?? r.deliveries?.completed ?? '-'}</div>
            </div>
            <div>
              <div className="stat-label">Failed</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{r.failed_deliveries ?? r.deliveries?.failed ?? '-'}</div>
            </div>
            <div>
              <div className="stat-label">Pending</div>
              <div className="stat-value">{r.pending_deliveries ?? r.deliveries?.pending ?? '-'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Delivered', value: Number(r.delivered ?? r.deliveries?.completed ?? 0) },
              { name: 'Failed', value: Number(r.failed_deliveries ?? r.deliveries?.failed ?? 0) },
              { name: 'Pending', value: Number(r.pending_deliveries ?? r.deliveries?.pending ?? 0) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <Cell fill="#16a34a" />
                <Cell fill="#dc2626" />
                <Cell fill="#d97706" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={18} /> Vehicle Status
          </h3>
          {vehicleStatusData.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {vehicleStatusData.map((v: any) => (
                  <div key={v.name || v.label}>
                    <div className="stat-label">{(v.name || v.label || '').replace(/_/g, ' ')}</div>
                    <div className="stat-value">{v.value}</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={vehicleStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {vehicleStatusData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-secondary" style={{ textAlign: 'center', padding: 24 }}>No vehicle data available</p>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
