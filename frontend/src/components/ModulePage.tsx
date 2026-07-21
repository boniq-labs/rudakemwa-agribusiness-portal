import type { ReactNode } from 'react';

interface ModulePageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function ModulePage({ title, subtitle, children, actions }: ModulePageProps) {
  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>{title}</h1>
          {subtitle && <p className="text-secondary" style={{ marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
      <div style={{ maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
}