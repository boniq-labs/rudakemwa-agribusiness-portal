import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import StatsCard from '../../components/StatsCard';
import { usersAPI, contractsAPI } from '../../api/endpoints';
import client from '../../api/client';
import { Download, FileText, FileSpreadsheet, Users, ClipboardCheck, Briefcase, BookOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

export default function HRReports() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  const { data: report } = useQuery({
    queryKey: ['hr-reports', startDate, endDate],
    queryFn: () => client.get('/hr/reports', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data.data || r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll().then(r => r.data.data),
  });

  const { data: contracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsAPI.getAll().then(r => r.data.data),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-report'],
    queryFn: () => client.get('/tasks', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data.data || []),
  });

  const r = report || {};
  const activeUsers = users?.filter((u: any) => u.is_active || u.status === 'active') || [];
  const deptStats = () => {
    const map: Record<string, number> = {};
    activeUsers.forEach((u: any) => {
      const d = u.department_name || (typeof u.department === 'object' ? u.department?.name : u.department) || 'Unassigned';
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([department, count]) => ({ department, count }));
  };

  const empColumns: Column<any>[] = [
    { key: 'department', label: 'Department' },
    { key: 'count', label: 'Employee Count' },
  ];

  const attColumns: Column<any>[] = [
    { key: 'date', label: 'Date' },
    { key: 'present', label: 'Present' },
    { key: 'absent', label: 'Absent' },
    { key: 'late', label: 'Late' },
  ];

  const recruitmentColumns: Column<any>[] = [
    { key: 'title', label: 'Job Title' },
    { key: 'applicants_count', label: 'Applicants', render: (r: any) => r.applicants_count ?? r.applicants ?? '-' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'open'} /> },
  ];

  const trainingColumns: Column<any>[] = [
    { key: 'title', label: 'Training', render: (r: any) => r.title || r.course_name || '-' },
    { key: 'participants', label: 'Participants', render: (r: any) => r.participants_count ?? r.participants ?? '-' },
    { key: 'start_date', label: 'Start' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'scheduled'} /> },
  ];

  const perfColumns: Column<any>[] = [
    { key: 'user_name', label: 'Employee', render: (r: any) => r.user_name || '-' },
    { key: 'rating', label: 'Rating', render: (r: any) => r.rating ? `${r.rating}/5` : '-' },
    { key: 'review_date', label: 'Date' },
  ];

  const contractColumns: Column<any>[] = [
    { key: 'user_name', label: 'Employee', render: (c: any) => c.user_name || '-' },
    { key: 'type', label: 'Type' },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date', label: 'End', render: (c: any) => c.end_date || 'Open-ended' },
    { key: 'status', label: 'Status', render: (c: any) => <StatusBadge status={c.status || 'active'} /> },
  ];

  const taskColumns: Column<any>[] = [
    { key: 'title', label: 'Task', render: (t: any) => t.title || t.name || '-' },
    { key: 'assigned_to', label: 'Assigned To', render: (t: any) => t.assigned_name || t.assigned_to || '-' },
    { key: 'due_date', label: 'Due Date', render: (t: any) => t.due_date ? new Date(t.due_date).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (t: any) => <StatusBadge status={t.status || 'pending'} /> },
    { key: 'priority', label: 'Priority', render: (t: any) => t.priority || '-' },
  ];

  const attData = Array.isArray(r.attendance) ? r.attendance : [];
  const contractData = Array.isArray(contracts) ? contracts : [];
  const recruitmentData = r.recruitment || [];
  const trainingData = r.training || [];
  const performanceData = r.performance || [];
  const tasksData = Array.isArray(tasks) ? tasks : [];

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

  return (
    <ModulePage title="HR Reports" subtitle="Analytics and reports">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
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
        <StatsCard title="Total Employees" value={r.total_employees ?? users?.length ?? 0} icon={Users} color="var(--primary)" />
        <StatsCard title="Present Today" value={r.present_today ?? '-'} icon={ClipboardCheck} color="var(--success)" />
        <StatsCard title="Open Positions" value={r.open_positions ?? '-'} icon={Briefcase} color="var(--danger)" />
        <StatsCard title="Active Trainings" value={r.active_trainings ?? '-'} icon={BookOpen} color="var(--primary)" />
        <StatsCard title="Avg Performance" value={r.avg_rating ? `${r.avg_rating}/5` : '-'} icon={Star} color="var(--success)" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(attData, 'attendance-report', ['date', 'present', 'absent', 'late'], ['Date', 'Present', 'Absent', 'Late'])}><FileText size={14} /> Attendance CSV</button>
        <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(deptStats(), 'employee-report', ['department', 'count'], ['Department', 'Employee Count'])}><FileSpreadsheet size={14} /> Employee CSV</button>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Employee Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(deptStats(), 'employee-report', ['department', 'count'], ['Department', 'Employee Count'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={empColumns} data={deptStats()} emptyMessage="No data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Attendance Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(attData, 'attendance-report', ['date', 'present', 'absent', 'late'], ['Date', 'Present', 'Absent', 'Late'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={attColumns} data={attData} emptyMessage="No attendance data for this period" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Recruitment Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(recruitmentData, 'recruitment-report', ['title', 'applicants_count', 'status'], ['Job Title', 'Applicants', 'Status'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={recruitmentColumns} data={recruitmentData} emptyMessage="No recruitment data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Training Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(trainingData, 'training-report', ['title', 'participants_count', 'start_date', 'status'], ['Training', 'Participants', 'Start', 'Status'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={trainingColumns} data={trainingData} emptyMessage="No training data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Performance Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(performanceData, 'performance-report', ['user_name', 'rating', 'review_date'], ['Employee', 'Rating', 'Date'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={perfColumns} data={performanceData} emptyMessage="No performance data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Tasks Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(tasksData, 'tasks-report', ['title', 'assigned_to', 'due_date', 'status', 'priority'], ['Task', 'Assigned To', 'Due Date', 'Status', 'Priority'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={taskColumns} data={tasksData} emptyMessage="No tasks data" />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Contract Report</h3>
            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }} onClick={() => exportCSV(contractData, 'contract-report', ['user_name', 'type', 'start_date', 'end_date', 'status'], ['Employee', 'Type', 'Start', 'End', 'Status'])}>
              <Download size={14} /> Export
            </button>
          </div>
          <DataTable columns={contractColumns} data={contractData} emptyMessage="No contracts found" />
        </div>
      </div>
    </ModulePage>
  );
}
