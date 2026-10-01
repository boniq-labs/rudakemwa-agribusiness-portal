/** Subtle "Recorded: <date>" secondary text for record rows/tables. */
export interface RecordedDateProps {
  value?: string | Date | null;
  createdByName?: string | null;
  createdAt?: string | Date | null;
}

export default function RecordedDate({ value, createdByName, createdAt }: RecordedDateProps) {
  const timestamp = createdAt || value;
  if (!timestamp) return <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>-</span>;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>-</span>;
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const nameStr = createdByName || '—';
  return (
    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
      <div>{dateStr}</div>
      <div>{timeStr} • {nameStr}</div>
    </span>
  );
}
