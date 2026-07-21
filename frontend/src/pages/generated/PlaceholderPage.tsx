import { UserCircle, PawPrint, Milk, Package, ShoppingCart, Truck, DollarSign, Stethoscope, type LucideIcon } from 'lucide-react';

const MODULE_ICONS: Record<string, LucideIcon> = {
  hr: UserCircle,
  animals: PawPrint,
  milk: Milk,
  stock: Package,
  procurement: ShoppingCart,
  logistics: Truck,
  accounting: DollarSign,
  sales: DollarSign,
  veterinary: Stethoscope,
};

interface PlaceholderPageProps {
  title: string;
  description?: string;
  module: string;
}

function Shimmer({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: 6,
        background: 'linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

function ShimmerCard() {
  return (
    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
      <Shimmer width={40} height={40} />
      <Shimmer width={80} height={24} />
      <Shimmer width={120} height={14} />
    </div>
  );
}

export default function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  const Icon = MODULE_ICONS[module] || UserCircle;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          <Icon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{title}</h1>
          {description && <p className="text-secondary" style={{ marginTop: 4 }}>{description}</p>}
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: 24 }}>
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </div>

      <div className="card" style={{ marginTop: 20, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '40px 0', color: 'var(--text-secondary)' }}>
          <Icon size={48} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Coming Soon</p>
          <p style={{ fontSize: '0.9rem' }}>This module page is under development.</p>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              {['Column 1', 'Column 2', 'Column 3', 'Column 4'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j}>
                    <Shimmer width={j === 0 ? '60%' : '80%'} height={14} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
