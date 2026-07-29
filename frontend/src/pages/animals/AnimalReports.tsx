import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import ModulePage from '../../components/ModulePage';
import {
  PawPrint, Baby, Syringe, Pill, Weight, Activity,
  FileText, FileSpreadsheet, Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportData {
  total_animals?: number;
  total_births?: number;
  total_vaccinations?: number;
  total_diseases?: number;
  total_treatments?: number;
  total_weights?: number;
  total_feedings?: number;
  total_sales?: number;
  total_deaths?: number;
  total_pregnancies?: number;
  [key: string]: any;
}

export default function AnimalReports() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['animal-reports'],
    queryFn: async () => (await client.get('/animals/reports')).data?.data || {},
  });

  const report: ReportData = reportData || {};

  const reportCards = [
    {
      title: 'Total Registered Animals',
      icon: PawPrint,
      color: '#2563eb',
      value: report.total_animals ?? 0,
    },
    {
      title: 'Birth Records',
      icon: Baby,
      color: '#d97706',
      value: report.total_births ?? 0,
    },
    {
      title: 'Vaccinations',
      icon: Syringe,
      color: '#16a34a',
      value: report.total_vaccinations ?? 0,
    },
    {
      title: 'Diseases',
      icon: Activity,
      color: '#dc2626',
      value: report.total_diseases ?? 0,
    },
    {
      title: 'Treatments',
      icon: Pill,
      color: '#8b5cf6',
      value: report.total_treatments ?? 0,
    },
    {
      title: 'Weight Records',
      icon: Weight,
      color: '#0891b2',
      value: report.total_weights ?? 0,
    },
  ];

  const handleExport = (format: string) => {
    toast.success(`${format} export coming soon`);
  };

  return (
    <ModulePage
      title="Animal Reports"
      subtitle="View animal production reports"
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-secondary" onClick={() => handleExport('PDF')}><FileText size={14} /> PDF</button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleExport('Excel')}><FileSpreadsheet size={14} /> Excel</button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleExport('Print')}><Printer size={14} /> Print</button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-secondary">Loading reports...</p>
      ) : (
        <div className="reports-grid">
          {reportCards.map((card) => (
            <div className="report-card" key={card.title}>
              <div className="report-card-header">
                <div className="report-card-icon" style={{ background: `${card.color}20`, color: card.color }}>
                  <card.icon size={20} />
                </div>
                <h3 className="report-card-title">{card.title}</h3>
              </div>
              <div className="report-card-value" style={{ color: card.color }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
