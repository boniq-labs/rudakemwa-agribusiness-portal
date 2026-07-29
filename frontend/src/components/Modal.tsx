import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { lockBody, unlockBody } from '../utils/bodyScroll';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, onClose, title, children, maxWidth = 520 }: ModalProps) {
  useEffect(() => {
    if (open) { lockBody(); return () => unlockBody(); }
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}