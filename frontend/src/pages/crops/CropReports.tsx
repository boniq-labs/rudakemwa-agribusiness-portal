import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { Download, FileText, FileSpreadsheet, Printer, Crop, Map, Activity, Package, Bug, DollarSign, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function CropReports() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(today);

  const { data: reportData } = useQuery({
    queryKey: ['crop-reports', startDate, endDate],
    queryFn: () => client.get('/crops/reports', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data.data),
  });

  const summary = reportData?.summary || {};
  const typesData = Array.isArray(reportData?.cropTypes) ? reportData.cropTypes : [];
  const landData = Array.isArray(reportData?.landAreas) ? reportData.landAreas : [];
  const activityData = Array.isArray(reportData?.activities) ? reportData.activities : [];
  const harvestData = Array.isArray(reportData?.harvestData) ? reportData.harvestData : [];
  const diseaseData = Array.isArray(reportData?.diseaseData) ? reportData.diseaseData : [];
  const salesData = Array.isArray(reportData?.salesData) ? reportData.salesData : [];

  const typeColumns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', render: (t: any) => t.description || '-' },
    { key: 'usage', label: 'Usage', render: (t: any) => t.usage || '-' },
  ];

  const landColumns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'area_size', label: 'Area Size', render: (l: any) => l.area_size ? `${l.area_size} ha` : '-' },
    { key: 'location', label: 'Location', render: (l: any) => l.location || '-' },
  ];

  const activityColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (a: any) => a.crop_name || '-' },
    { key: 'land_name', label: 'Land', render: (a: any) => a.land_name || '-' },
    { key: 'planting_date', label: 'Planted', render: (a: any) => a.planting_date ? new Date(a.planting_date).toLocaleDateString() : '-' },
    { key: 'quantity_planted', label: 'Qty Planted', render: (a: any) => a.quantity_planted ?? '-' },
    { key: 'quantity_harvested', label: 'Qty Harvested', render: (a: any) => a.quantity_harvested ?? '-' },
    { key: 'status', label: 'Status', render: (a: any) => <StatusBadge status={a.status} /> },
  ];

  const harvestColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (h: any) => h.crop_name || '-' },
    { key: 'land_name', label: 'Land', render: (h: any) => h.land_name || '-' },
    { key: 'harvest_date', label: 'Harvest Date', render: (h: any) => h.harvest_date ? new Date(h.harvest_date).toLocaleDateString() : '-' },
    { key: 'quantity_harvested', label: 'Qty Harvested', render: (h: any) => h.quantity_harvested ?? '-' },
    { key: 'sales_amount', label: 'Value ($)', render: (h: any) => h.sales_amount ? Number(h.sales_amount).toLocaleString() : '-' },
    { key: 'notes', label: 'Notes', render: (h: any) => h.notes || '-' },
  ];

  const diseaseColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (d: any) => d.crop_name || '-' },
    { key: 'land_name', label: 'Land', render: (d: any) => d.land_name || '-' },
    { key: 'diseases', label: 'Disease', render: (d: any) => d.diseases || '-' },
    { key: 'created_at', label: 'Reported', render: (d: any) => d.created_at ? new Date(d.created_at).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (d: any) => <StatusBadge status={d.status || 'reported'} /> },
    { key: 'notes', label: 'Notes', render: (d: any) => d.notes || '-' },
  ];

  const salesColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (s: any) => s.crop_name || '-' },
    { key: 'land_name', label: 'Land', render: (s: any) => s.land_name || '-' },
    { key: 'sales_amount', label: 'Amount ($)', render: (s: any) => s.sales_amount ? Number(s.sales_amount).toLocaleString() : '-' },
    { key: 'harvest_date', label: 'Date', render: (s: any) => s.harvest_date ? new Date(s.harvest_date).toLocaleDateString() : '-' },
    { key: 'notes', label: 'Notes', render: (s: any) => s.notes || '-' },
  ];

  const exportCSV = (data: any[], filename: string, keys: string[], labels: string[]) => {
    if (!data.length) { toast.error('No data to export'); return; }
    const header = labels.join(',');
    const rows = data.map((row: any) => keys.map(k => {
      const val = typeof row[k] === 'object' ? row[k]?.name || row[k]?.id || '' : row[k] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`${filename} exported`);
  };

  const handleExport = (format: string, data?: any[], keys?: string[], labels?: string[]) => {
    if (data && keys && labels) {
      exportCSV(data, format, keys, labels);
      return;
    }
    toast.success(`${format} export coming soon`);
  };

  return (
    <ModulePage title="Crop Reports" subtitle="Crop production reports and analytics">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text)' }} />
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <StatsCard title="Total Crop Types" value={summary.totalCropTypes ?? 0} icon={Crop} color="var(--primary)" />
        <StatsCard title="Land Areas" value={summary.totalLandAreas ?? 0} icon={Map} color="var(--success)" />
        <StatsCard title="Active Crops" value={summary.activeCrops ?? 0} icon={Activity} color="var(--warning)" />
        <StatsCard title="Harvested" value={summary.harvested ?? 0} icon={Package} color="var(--success)" />
        <StatsCard title="Diseases Reported" value={summary.diseasesReported ?? 0} icon={Bug} color="var(--danger)" />
        <StatsCard title="Total Sales" value={summary.totalSales ? `$${Number(summary.totalSales).toLocaleString()}` : '-'} icon={DollarSign} color="var(--primary)" />
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatsCard title="Planted Qty" value={summary.totalPlantedQty ?? 0} icon={TrendingUp} color="var(--primary)" />
        <StatsCard title="Harvested Qty" value={summary.totalHarvestedQty ?? 0} icon={Package} color="var(--success)" />
        <StatsCard title="Avg Yield" value={summary.avgYield ? Number(summary.avgYield).toFixed(2) : '-'} icon={Award} color="var(--warning)" />
        <StatsCard title="Active Seasons" value={summary.activeSeasons ?? 0} icon={Map} color="var(--info)" />
        <StatsCard title="Completed" value={summary.completedActivities ?? 0} icon={Activity} color="var(--success)" />
        <StatsCard title="Active Disease Cases" value={summary.activeDiseaseCases ?? 0} icon={AlertTriangle} color="var(--danger)" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('PDF')}><FileText size={14} /> PDF</button>
        <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Excel')}><FileSpreadsheet size={14} /> Excel</button>
        <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Print')}><Printer size={14} /> Print</button>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Crop Types</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(typesData, 'crop-types', ['name', 'description', 'usage'], ['Name', 'Description', 'Usage'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={typeColumns} data={typesData} emptyMessage="No crop types" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Land Areas</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(landData, 'land-areas', ['name', 'area_size', 'location'], ['Name', 'Area Size (ha)', 'Location'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={landColumns} data={landData} emptyMessage="No land areas" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Activities</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(activityData, 'activities', ['crop_name', 'land_name', 'planting_date', 'quantity_planted', 'quantity_harvested', 'status'], ['Crop', 'Land', 'Planted', 'Qty Planted', 'Qty Harvested', 'Status'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={activityColumns} data={activityData} emptyMessage="No activities" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Harvest</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(harvestData, 'harvest', ['crop_name', 'land_name', 'harvest_date', 'quantity_harvested', 'sales_amount', 'notes'], ['Crop', 'Land', 'Harvest Date', 'Qty Harvested', 'Value ($)', 'Notes'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={harvestColumns} data={harvestData} emptyMessage="No harvest data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Diseases</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(diseaseData, 'diseases', ['crop_name', 'land_name', 'diseases', 'status', 'created_at', 'notes'], ['Crop', 'Land', 'Disease', 'Status', 'Reported', 'Notes'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={diseaseColumns} data={diseaseData} emptyMessage="No diseases reported" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Sales</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(salesData, 'sales', ['crop_name', 'land_name', 'sales_amount', 'harvest_date', 'notes'], ['Crop', 'Land', 'Amount ($)', 'Date', 'Notes'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={salesColumns} data={salesData} emptyMessage="No sales data" />
        </div>
      </div>
    </ModulePage>
  );
}
