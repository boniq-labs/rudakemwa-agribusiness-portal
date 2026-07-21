import { TrendingUp, TrendingDown } from 'lucide-react';
import type { FC } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: FC<{ size?: number; className?: string }>;
  trend?: { value: number; isUp: boolean };
  color?: string;
}

export default function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const bgColor = color ? `${color}20` : 'var(--primary-light)';
  const iconColor = color || 'var(--primary)';

  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bgColor, color: iconColor }}>
        <Icon size={24} />
      </div>
      <div className="stat-info" style={{ minWidth: 0 }}>
        <div className="stat-value" style={{ wordBreak: 'break-word' }}>{value}</div>
        <div className="stat-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.75rem', color: trend.isUp ? 'var(--success)' : 'var(--danger)' }}>
            {trend.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
}