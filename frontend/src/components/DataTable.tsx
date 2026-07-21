import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

interface Pagination {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  pagination?: Pagination;
  emptyMessage?: string;
}

function LoadingSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j}>
              <div style={{ height: 16, background: 'var(--border)', borderRadius: 4, animation: 'pulse 1.5s infinite', width: j === 0 ? '60%' : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T extends Record<string, any>>({ columns, data, loading, onRowClick, pagination, emptyMessage }: DataTableProps<T>) {
  return (
    <div className="data-table-wrapper">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton columns={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center" style={{ padding: 48, color: 'var(--text-secondary)' }}>
                  {emptyMessage || 'No data found'}
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  onClick={() => onRowClick?.(item)}
                  style={{ cursor: onRowClick ? 'pointer' : undefined }}
                >
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: 8 }}>
          <span>{pagination.total} total</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                style={{ padding: '6px 10px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: pagination.page > 1 ? 'pointer' : 'not-allowed', opacity: pagination.page <= 1 ? 0.5 : 1, minWidth: 36, minHeight: 36 }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                style={{ padding: '6px 10px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 6, cursor: pagination.page < pagination.pages ? 'pointer' : 'not-allowed', opacity: pagination.page >= pagination.pages ? 0.5 : 1, minWidth: 36, minHeight: 36 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}