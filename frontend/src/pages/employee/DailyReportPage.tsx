import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
import FormField from '../../components/FormField';

export default function DailyReportPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: myReports, isLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => reportsAPI.getMy().then(r => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => reportsAPI.submit(data),
    onSuccess: (r: any) => {
      setSuccessMsg(r.data?.message || 'Report submitted!');
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setSuccessMsg(err.response?.data?.error || 'Failed to submit report');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    submitMutation.mutate({ title, content, report_date: reportDate });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: '#6b7280', submitted: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
    return <span style={{ background: colors[status] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{status}</span>;
  };

  return (
    <ModulePage title="Daily Report" subtitle="Submit your daily activity report">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>New Report</h3>
          {successMsg && (
            <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, background: successMsg.includes('Failed') ? '#fef2f2' : '#f0fdf4', color: successMsg.includes('Failed') ? '#dc2626' : '#16a34a', border: `1px solid ${successMsg.includes('Failed') ? '#fecaca' : '#bbf7d0'}` }}>{successMsg}</div>
          )}
          <form onSubmit={handleSubmit}>
            <FormField label="Report Date">
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
            </FormField>
            <FormField label="Title (optional)">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title for your report" />
            </FormField>
            <FormField label="Report Content" required>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Describe what you worked on today, tasks completed, issues encountered..." required style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
            </FormField>
            <button type="submit" className="btn btn-primary" disabled={submitMutation.isPending || !content.trim()} style={{ marginTop: 8 }}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>My Recent Reports</h3>
          {isLoading ? <p style={{ color: 'var(--text-secondary)' }}>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflow: 'auto' }}>
              {(!myReports || myReports.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)' }}>No reports yet. Submit your first report.</p>
              ) : myReports.map((r: any) => (
                <div key={r.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{r.title || 'Untitled'}</strong>
                    {statusBadge(r.status)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.report_date}</div>
                  <p style={{ fontSize: '0.85rem', marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.content}</p>
                  {r.manager_comment && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#f3f4f6', borderRadius: 4, fontSize: '0.8rem', borderLeft: '3px solid #6366f1' }}>
                      <strong>Manager:</strong> {r.manager_comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
