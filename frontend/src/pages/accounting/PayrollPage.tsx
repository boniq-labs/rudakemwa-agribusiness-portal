import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { accountingAPI } from '../../api/endpoints';
import client from '../../api/client';
import { formatAmount } from '../../services/currency';
import { DollarSign, Users, CheckCircle, Clock, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const confirm = useConfirm();

  const { data: payroll, isLoading } = useQuery({
    queryKey: ['accounting-payroll', month],
    queryFn: () => accountingAPI.getPayroll({ month }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => accountingAPI.createPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
    },
  });

  const processMutation = useMutation({
    mutationFn: (data: any) => accountingAPI.processPayroll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => client.delete(`/accounting/payroll/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payroll'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      toast.success('Payroll record deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete payroll record');
    },
  });

  const employees = useMemo(() => {
    if (!payroll) return [];
    return payroll.employees || payroll.records || payroll || [];
  }, [payroll]);

  const totalPayroll = useMemo(() => {
    return employees.reduce((s: number, e: any) => s + (Number(e.net_salary || e.net_salary || e.total) || 0), 0);
  }, [employees]);

  const paidCount = useMemo(() => {
    return employees.filter((e: any) => e.status === 'paid').length;
  }, [employees]);

  const pendingCount = useMemo(() => {
    return employees.filter((e: any) => e.status === 'pending' || e.status === 'draft').length;
  }, [employees]);

  const prevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setMonth(d.toISOString().substring(0, 7));
  };

  const nextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m, 1);
    setMonth(d.toISOString().substring(0, 7));
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const columns: Column<any>[] = [
    { key: 'employee', label: 'Employee', render: (e: any) => {
      const emp = typeof e.employee === 'object' ? e.employee : null;
      return emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || '-' : e.employee_name || '-';
    }},
    { key: 'basic_salary', label: 'Basic Salary', render: (e: any) => formatAmount(Number(e.basic_salary) || 0) },
    { key: 'allowances', label: 'Allowances', render: (e: any) => formatAmount(Number(e.allowances || e.allowance) || 0) },
    { key: 'deductions', label: 'Deductions', render: (e: any) => formatAmount(Number(e.deductions || e.total_deductions) || 0) },
    { key: 'net_salary', label: 'Net Salary', render: (e: any) => <span style={{ fontWeight: 600 }}>{formatAmount(Number(e.net_salary || e.total) || 0)}</span> },
    { key: 'status', label: 'Status', render: (e: any) => <StatusBadge status={e.status} /> },
    {
      key: 'actions', label: '',
      render: (e: any) => (
        <div className="actions">
          <button className="btn btn-sm btn-danger" disabled={deleteMutation.isPending} onClick={async (ev) => { ev.stopPropagation(); if (await confirm('Delete this payroll record?')) deleteMutation.mutate(e.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <ModulePage
      title="Payroll"
      subtitle="Manage employee payroll"
      actions={
        <>
          <button className="btn btn-primary" onClick={() => createMutation.mutate({ month })} disabled={createMutation.isPending}>
            <DollarSign size={16} /> {createMutation.isPending ? 'Generating...' : 'Create Payroll'}
          </button>
          <button className="btn btn-primary" onClick={() => processMutation.mutate({ month })} disabled={processMutation.isPending}>
            <CheckCircle size={16} /> {processMutation.isPending ? 'Processing...' : 'Process Payroll'}
          </button>
        </>
      }
    >
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatsCard title="Total Payroll" value={formatAmount(totalPayroll)} icon={DollarSign} color="var(--primary)" />
        <StatsCard title="Paid" value={paidCount} icon={CheckCircle} color="var(--success)" />
        <StatsCard title="Pending" value={pendingCount} icon={Clock} color="var(--warning)" />
        <StatsCard title="Employees" value={employees.length} icon={Users} color="var(--info)" />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button className="btn btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{monthLabel}</span>
          <button className="btn btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      <DataTable columns={columns} data={employees} loading={isLoading} emptyMessage="No payroll records for this month" />
    </ModulePage>
  );
}
