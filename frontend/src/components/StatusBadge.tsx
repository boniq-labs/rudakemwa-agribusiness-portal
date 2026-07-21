const STATUS_COLORS: Record<string, string> = {
  pending: '#fef9c3 #854d0e',
  pending_review: '#fef9c3 #854d0e',
  approved: '#dcfce7 #166534',
  active: '#dcfce7 #166534',
  completed: '#dcfce7 #166534',
  confirmed: '#dcfce7 #166534',
  paid: '#dcfce7 #166534',
  delivered: '#dcfce7 #166534',
  in_progress: '#dbeafe #1e40af',
  in_transit: '#dbeafe #1e40af',
  processing: '#dbeafe #1e40af',
  rejected: '#f3f4f6 #374151',
  inactive: '#f3f4f6 #374151',
  draft: '#f3f4f6 #374151',
  cancelled: '#fef2f2 #991b1b',
  void: '#fef2f2 #991b1b',
  refunded: '#fef2f2 #991b1b',
  terminated: '#fef2f2 #991b1b',
  expired: '#fef2f2 #991b1b',
  closed: '#f3f4f6 #374151',
  sick: '#fef9c3 #854d0e',
  recovered: '#dcfce7 #166534',
  deceased: '#f3f4f6 #374151',
  low: '#fef9c3 #854d0e',
  medium: '#dbeafe #1e40af',
  high: '#fef2f2 #991b1b',
  urgent: '#fef2f2 #991b1b',
};

export default function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const colors = STATUS_COLORS[status.toLowerCase()] || '#f3f4f6 #374151';
  const [bg, text] = colors.split(' ');

  return (
    <span
      className="badge"
      style={{ background: bg, color: text }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
