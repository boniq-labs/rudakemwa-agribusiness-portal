import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';
import toast from 'react-hot-toast';
import ModulePage from '../../components/ModulePage';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import RecordedDate from '../../components/RecordedDate';
import StatusBadge from '../../components/StatusBadge';
import { Clock, UserCheck, UserX, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', date],
    queryFn: () => client.get('/attendance', { params: { date } }).then(r => r.data.data || r.data || []),
  });

  const checkInMutation = useMutation({
    mutationFn: (userId: number) => client.post('/attendance/checkin', { user_id: userId, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', date] });
      toast.success('Checked in successfully');
    },
    onError: () => toast.error('Failed to check in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: (userId: number) => client.post('/attendance/checkout', { user_id: userId, date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', date] });
      toast.success('Checked out successfully');
    },
    onError: () => toast.error('Failed to check out'),
  });

  const data = Array.isArray(records) ? records : [];
  const present = data.filter((r: any) => r.status === 'present').length;
  const absent = data.filter((r: any) => r.status === 'absent').length;
  const late = data.filter((r: any) => r.status === 'late').length;
  const onLeave = data.filter((r: any) => r.status === 'on_leave').length;

  const calcHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return '-';
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const diff = (outH * 60 + outM) - (inH * 60 + inM);
    if (diff <= 0) return '-';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const columns: Column<any>[] = [
    {
      key: 'employee', label: 'Employee',
      render: (r: any) => r.user_name || r.employee_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '-',
    },
    { key: 'date', label: 'Date', render: (r: any) => r.date ? new Date(r.date).toLocaleDateString() : '-' },
    { key: 'check_in', label: 'Check In', render: (r: any) => r.check_in || '-' },
    { key: 'check_out', label: 'Check Out', render: (r: any) => r.check_out || '-' },
    { key: 'hours', label: 'Hours Worked', render: (r: any) => calcHours(r.check_in, r.check_out) },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status || 'absent'} /> },
    {
      key: 'recorded', label: 'Recorded', render: (r: any) => <RecordedDate value={r.created_at} />},
      { key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="actions">
          {(!r.check_in || r.status === 'absent') && (
            <button className="btn btn-sm btn-primary" onClick={() => checkInMutation.mutate(r.user_id)} disabled={checkInMutation.isPending}>
              <LogIn size={14} /> Check In
            </button>
          )}
          {r.check_in && !r.check_out && (
            <button className="btn btn-sm" style={{ background: 'var(--warning)', color: '#fff' }} onClick={() => checkOutMutation.mutate(r.user_id)} disabled={checkOutMutation.isPending}>
              <LogOut size={14} /> Check Out
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Attendance"
      subtitle="Track employee attendance"
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem', background: 'var(--card-bg)', color: 'var(--text)' }}
          />
        </div>
      }
    >
      <div className="stats-grid">
        <StatsCard title="Present" value={present} icon={UserCheck} color="var(--success)" />
        <StatsCard title="Absent" value={absent} icon={UserX} color="var(--danger)" />
        <StatsCard title="Late" value={late} icon={AlertTriangle} color="var(--warning)" />
        <StatsCard title="On Leave" value={onLeave} icon={Clock} color="var(--primary)" />
      </div>

      <DataTable columns={columns} data={data} loading={isLoading} emptyMessage="No attendance records for this date" />
    </ModulePage>
  );
}
