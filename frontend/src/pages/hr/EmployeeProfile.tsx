import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, attendanceAPI, performanceAPI, contractsAPI, trainingAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import { ArrowLeft, Calendar, Mail, Phone, MapPin, Shield, Briefcase, Clock, User, Camera } from 'lucide-react';
import type { Column } from '../../components/DataTable';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await usersAPI.getById(Number(id))).data.data,
    enabled: !!id,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-employee', id],
    queryFn: async () => (await attendanceAPI.getAll({ user_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: performanceData } = useQuery({
    queryKey: ['performance-employee', id],
    queryFn: async () => (await performanceAPI.getAll({ user_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: contractsData } = useQuery({
    queryKey: ['contracts-employee', id],
    queryFn: async () => (await contractsAPI.getAll({ user_id: id })).data.data || [],
    enabled: !!id,
  });

  const { data: trainingsData } = useQuery({
    queryKey: ['trainings-employee', id],
    queryFn: async () => (await trainingAPI.getAll({ user_id: id })).data.data || [],
    enabled: !!id,
  });

  const attendance = Array.isArray(attendanceData) ? attendanceData : [];
  const performance = Array.isArray(performanceData) ? performanceData : [];
  const contracts = Array.isArray(contractsData) ? contractsData : [];
  const trainings = Array.isArray(trainingsData) ? trainingsData : [];

  if (isLoading) return <ModulePage title="Employee Profile"><div className="loading-screen"><div className="loading-spinner" /></div></ModulePage>;
  if (!employee) return <ModulePage title="Employee Profile"><p className="text-secondary">Employee not found</p></ModulePage>;

  const attColumns: Column<any>[] = [
    { key: 'date', label: 'Date', render: (a: any) => a.date ? new Date(a.date).toLocaleDateString() : '-' },
    { key: 'clock_in', label: 'Check In', render: (a: any) => a.clock_in || '-' },
    { key: 'clock_out', label: 'Check Out', render: (a: any) => a.clock_out || '-' },
    { key: 'status', label: 'Status', render: (a: any) => <StatusBadge status={a.status || 'present'} /> },
  ];

  const perfColumns: Column<any>[] = [
    { key: 'review_date', label: 'Date', render: (p: any) => p.review_date ? new Date(p.review_date).toLocaleDateString() : '-' },
    { key: 'rating', label: 'Rating', render: (p: any) => p.rating ? `${p.rating}/5` : '-' },
    { key: 'reviewer', label: 'Reviewer', render: (p: any) => p.reviewer_name || p.reviewer || '-' },
  ];

  const contractColumns: Column<any>[] = [
    { key: 'type', label: 'Type', render: (c: any) => c.type || c.contract_type || '-' },
    { key: 'start_date', label: 'Start', render: (c: any) => c.start_date ? new Date(c.start_date).toLocaleDateString() : '-' },
    { key: 'end_date', label: 'End', render: (c: any) => c.end_date ? new Date(c.end_date).toLocaleDateString() : 'Ongoing' },
    { key: 'status', label: 'Status', render: (c: any) => <StatusBadge status={c.status || 'active'} /> },
  ];

  const trainingColumns: Column<any>[] = [
    { key: 'title', label: 'Training', render: (t: any) => t.title || t.course_name || '-' },
    { key: 'provider', label: 'Provider', render: (t: any) => t.provider || '-' },
    { key: 'start_date', label: 'Start', render: (t: any) => t.start_date ? new Date(t.start_date).toLocaleDateString() : '-' },
    { key: 'end_date', label: 'End', render: (t: any) => t.end_date ? new Date(t.end_date).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (t: any) => <StatusBadge status={t.status || 'scheduled'} /> },
  ];

  return (
    <ModulePage title={`${employee.first_name} ${employee.last_name}`} subtitle="Employee profile and records">
      <button onClick={() => navigate(-1)} className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary-light)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {employee.photo ? (
                <img src={employee.photo} alt={employee.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={40} color="var(--primary)" />
              )}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{employee.first_name} {employee.last_name}</h2>
            <p className="text-secondary" style={{ marginBottom: 8 }}>{employee.employee_code || employee.email}</p>
            <StatusBadge status={employee.is_active ? 'active' : 'inactive'} />
          </div>

          <div className="card" style={{ marginTop: 16, padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} /> Details
            </h3>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} className="text-secondary" /> {employee.email || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} className="text-secondary" /> {employee.phone || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} className="text-secondary" /> {employee.address || '-'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={14} className="text-secondary" /> Hired: {employee.date_hired ? new Date(employee.date_hired).toLocaleDateString() : '-'}</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 8 }}><Briefcase size={14} /> Employment</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span className="text-secondary">Department:</span> {employee.department_name || '-'}</div>
                <div><span className="text-secondary">Position:</span> {employee.position || '-'}</div>
                <div><span className="text-secondary">Type:</span> {employee.employment_type || '-'}</div>
                <div><span className="text-secondary">Role:</span> {employee.role_name || '-'}</div>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 8 }}><Shield size={14} /> Account</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span className="text-secondary">Username:</span> {employee.username || '-'}</div>
                <div><span className="text-secondary">Status:</span> {employee.is_active ? 'Active' : 'Inactive'}</div>
                <div><span className="text-secondary">Last Login:</span> {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}</div>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 8 }}><Clock size={14} /> Stats</h3>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span className="text-secondary">Trainings:</span> {trainings.length}</div>
                <div><span className="text-secondary">Reviews:</span> {performance.length}</div>
                <div><span className="text-secondary">Contracts:</span> {contracts.length}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16, padding: 20 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Recent Attendance</h3>
            <DataTable columns={attColumns} data={attendance.slice(0, 10)} emptyMessage="No attendance records" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Performance Reviews</h3>
              <DataTable columns={perfColumns} data={performance.slice(0, 5)} emptyMessage="No reviews" />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Contracts</h3>
              <DataTable columns={contractColumns} data={contracts.slice(0, 5)} emptyMessage="No contracts" />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>Training Records</h3>
              <DataTable columns={trainingColumns} data={trainings.slice(0, 5)} emptyMessage="No training records" />
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
