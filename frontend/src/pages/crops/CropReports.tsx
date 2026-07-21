import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';
import client from '../../api/client';
import { Download, FileText, FileSpreadsheet, Printer, Crop, Map, Activity, Package, Bug, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function CropReports() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfYear);
  const [endDate, setEndDate] = useState(today);

  const { data: types } = useQuery({
    queryKey: ['crop-types-report'],
    queryFn: () => client.get('/crops/types').then(r => r.data.data),
  });

  const { data: landAreas } = useQuery({
    queryKey: ['land-areas-report'],
    queryFn: () => client.get('/crops/land').then(r => r.data.data),
  });

  const { data: activities } = useQuery({
    queryKey: ['crop-activities-report', startDate, endDate],
    queryFn: () => client.get('/crops/activities', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data.data),
  });

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

  const diseaseColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (d: any) => d.crop_name || '-' },
    { key: 'diseases', label: 'Disease', render: (d: any) => d.diseases || '-' },
    { key: 'status', label: 'Status', render: (d: any) => <StatusBadge status={d.status || 'reported'} /> },
  ];

  const salesColumns: Column<any>[] = [
    { key: 'crop_name', label: 'Crop', render: (s: any) => s.crop_name || '-' },
    { key: 'sales_amount', label: 'Amount ($)', render: (s: any) => s.sales_amount ? Number(s.sales_amount).toLocaleString() : '-' },
    { key: 'harvest_date', label: 'Date', render: (s: any) => s.harvest_date ? new Date(s.harvest_date).toLocaleDateString() : '-' },
  ];

  const typesData = Array.isArray(types) ? types : [];
  const landData = Array.isArray(landAreas) ? landAreas : [];
  const activityData = Array.isArray(activities) ? activities : [];
  const harvestData = (activityData || []).filter((a: any) => a.status === 'harvested');
  const diseaseData = (activityData || []).filter((a: any) => a.diseases);
  const salesData = (activityData || []).filter((a: any) => a.sales_amount);

  const handleExport = (format: string) => {
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

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatsCard title="Total Crop Types" value={typesData.length ?? 0} icon={Crop} color="var(--primary)" />
        <StatsCard title="Land Areas" value={landData.length ?? 0} icon={Map} color="var(--success)" />
        <StatsCard title="Active Crops" value={activityData.filter((a: any) => a.status === 'planted' || a.status === 'growing').length ?? 0} icon={Activity} color="var(--warning)" />
        <StatsCard title="Harvested" value={harvestData.length ?? 0} icon={Package} color="var(--success)" />
        <StatsCard title="Diseases Reported" value={diseaseData.length ?? 0} icon={Bug} color="var(--danger)" />
        <StatsCard title="Total Sales" value={salesData.reduce((sum: number, s: any) => sum + (Number(s.sales_amount) || 0), 0) ? `$${salesData.reduce((sum: number, s: any) => sum + (Number(s.sales_amount) || 0), 0).toLocaleString()}` : '-'} icon={DollarSign} color="var(--primary)" />
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
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Crop Types PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={typeColumns} data={typesData} emptyMessage="No crop types" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Land Areas</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Land Areas PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={landColumns} data={landData} emptyMessage="No land areas" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Activities</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Activities PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={activityColumns} data={activityData} emptyMessage="No activities" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Harvest</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Harvest PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={activityColumns} data={harvestData} emptyMessage="No harvest data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Diseases</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Diseases PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={diseaseColumns} data={diseaseData} emptyMessage="No diseases reported" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Sales</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => handleExport('Sales PDF')}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={salesColumns} data={salesData} emptyMessage="No sales data" />
        </div>
      </div>
    </ModulePage>
  );
}
