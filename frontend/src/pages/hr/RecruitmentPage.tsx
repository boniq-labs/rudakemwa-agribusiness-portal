import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModulePage from '../../components/ModulePage';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import FormField from '../../components/FormField';
import { recruitmentAPI } from '../../api/endpoints';
import { Briefcase, Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Column } from '../../components/DataTable';

const APPLICANT_STATUSES = ['new', 'screening', 'interviewed', 'shortlisted', 'offered', 'hired', 'rejected'];

export default function RecruitmentPage() {
  const queryClient = useQueryClient();
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobForm, setJobForm] = useState({ title: '', description: '', status: 'open' });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['recruitment-jobs'],
    queryFn: () => recruitmentAPI.getJobs().then(r => r.data.data),
  });

  const { data: applicants, isLoading: applicantsLoading } = useQuery({
    queryKey: ['recruitment-applicants'],
    queryFn: () => recruitmentAPI.getApplicants().then(r => r.data.data),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => editingJob
      ? recruitmentAPI.updateJob(editingJob.id, data)
      : recruitmentAPI.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-jobs'] });
      toast.success(editingJob ? 'Position updated' : 'Position created');
      setShowJobModal(false);
      setEditingJob(null);
      setJobForm({ title: '', description: '', status: 'open' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const closeJobMutation = useMutation({
    mutationFn: (id: number) => recruitmentAPI.closeJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-jobs'] });
      toast.success('Position closed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => recruitmentAPI.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment-applicants'] }),
  });

  const applicantColumns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', render: (a: any) => a.email || '-' },
    { key: 'job_title', label: 'Position', render: (a: any) => a.job_title || '-' },
    { key: 'status', label: 'Status', render: (a: any) => <StatusBadge status={a.status || 'new'} /> },
    {
      key: 'actions', label: 'Update Status',
      render: (a: any) => (
        <select
          value={a.status || 'new'}
          onChange={e => updateStatusMutation.mutate({ id: a.id, status: e.target.value })}
          style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.8rem', background: 'var(--card-bg)', color: 'var(--text)' }}
        >
          {APPLICANT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      ),
    },
  ];

  const closeJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setJobForm({ title: '', description: '', status: 'open' });
  };

  const openEditJob = (job: any) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      description: job.description || '',
      status: job.status || 'open',
    });
    setShowJobModal(true);
  };

  const openJobs = (jobs || []).filter((j: any) => j.status === 'open');

  return (
    <ModulePage
      title="Recruitment"
      subtitle="Manage job postings and applicants"
      actions={
        <button className="btn btn-primary" onClick={() => setShowJobModal(true)}>
          <Plus size={16} /> New Position
        </button>
      }
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Briefcase size={20} /> Open Positions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {openJobs.length === 0 && !jobsLoading && <p className="text-secondary">No open positions</p>}
        {openJobs.map((j: any) => (
          <div key={j.id} className="card">
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{j.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{j.description || 'No description'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Users size={16} /> {j.applicant_count ?? 0} applicants
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={j.status || 'open'} />
                <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); openEditJob(j); }}>
                  <Edit2 size={14} />
                </button>
                {j.status === 'open' && (
                  <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); if (confirm('Close this position?')) closeJobMutation.mutate(j.id); }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={20} /> Applicants
        </h3>
      </div>
      <DataTable columns={applicantColumns} data={applicants || []} loading={applicantsLoading} emptyMessage="No applicants yet" />

      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeJobModal}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 24, width: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{editingJob ? 'Edit Position' : 'New Position'}</h2>
              <button onClick={closeJobModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createJobMutation.mutate(jobForm); }}>
              <FormField label="Job Title" required>
                <input value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))} required />
              </FormField>
              <FormField label="Description">
                <textarea value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </FormField>
              <FormField label="Status">
                <select value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </FormField>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={closeJobModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? 'Saving...' : editingJob ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}
