/** Subtle "Recorded: <date>" secondary text for record rows/tables. */
export default function RecordedDate({ value }: { value?: string | Date | null }) {
  if (!value) return <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>-</span>;
  const d = new Date(value);
  if (isNaN(d.getTime())) return <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>-</span>;
  return (
    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
      {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
    </span>
  );
}
