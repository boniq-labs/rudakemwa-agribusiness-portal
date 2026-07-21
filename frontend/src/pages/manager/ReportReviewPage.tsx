import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsAPI } from '../../api/endpoints';
import ModulePage from '../../components/ModulePage';
export default function ReportReviewPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('submitted');
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['dept-reports', filter],
    queryFn: () => reportsAPI.getDepartment({ status: filter === 'all' ? undefined : filter }).then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, comment: c }: { id: number; comment?: string }) => reportsAPI.approve(id, c),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dept-reports'] }); setSelectedId(null); setComment(''); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment: c }: { id: number; comment: string }) => reportsAPI.reject(id, c),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dept-reports'] }); setSelectedId(null); setComment(''); },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: '#6b7280', submitted: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
    return <span style={{ background: colors[status] || '#6b7280', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem' }}>{status}</span>;
  };

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      approveMutation.mutate({ id, comment: comment || undefined });
    } else {
      if (!comment.trim()) return;
      rejectMutation.mutate({ id, comment });
    }
  };

  return (
    <ModulePage title="Report Review" subtitle="Review employee daily reports">
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['all', 'submitted', 'approved', 'rejected'].map(s => (
          <button key={s} className="btn" onClick={() => setFilter(s)} style={{ background: filter === s ? 'var(--primary)' : 'var(--card-bg)', color: filter === s ? '#fff' : 'var(--text)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      {isLoading ? <p style={{ color: 'var(--text-secondary)' }}>Loading reports...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(!reports || reports.length === 0) ? (
            <p style={{ color: 'var(--text-secondary)' }}>No reports found.</p>
          ) : reports.map((r: any) => (
            <div key={r.id} style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <strong>{r.first_name} {r.last_name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 8 }}>@{r.username}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 8 }}>{r.department_name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.report_date}</span>
                  {statusBadge(r.status)}
                </div>
              </div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{r.title || 'Untitled Report'}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', marginBottom: 8 }}>{r.content}</p>

              {r.status === 'submitted' && (
                <div>
                  {selectedId === r.id ? (
                    <div style={{ marginTop: 8, padding: 12, background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Add a comment (required for rejection)..." style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, resize: 'vertical', background: 'var(--card-bg)', color: 'var(--text)' }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn" style={{ background: '#10b981', color: '#fff', border: 'none' }} onClick={() => handleAction(r.id, 'approve')} disabled={approveMutation.isPending}>Approve</button>
                        <button className="btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => handleAction(r.id, 'reject')} disabled={rejectMutation.isPending || !comment.trim()}>Reject</button>
                        <button className="btn" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => { setSelectedId(null); setComment(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn" style={{ fontSize: '0.85rem', padding: '4px 12px' }} onClick={() => setSelectedId(r.id)}>Review</button>
                  )}
                </div>
              )}

              {r.manager_comment && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#f3f4f6', borderRadius: 4, fontSize: '0.85rem', borderLeft: '3px solid #6366f1' }}>
                  <strong>Manager comment:</strong> {r.manager_comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
