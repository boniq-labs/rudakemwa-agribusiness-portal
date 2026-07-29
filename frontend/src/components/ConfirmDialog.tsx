import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { lockBody, unlockBody } from '../utils/bodyScroll';

type ConfirmFn = (message: string, title?: string, confirmLabel?: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; title?: string; confirmLabel?: string; resolve: (v: boolean) => void } | null>(null);
  const prevResolve = useRef<((v: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((message: string, title?: string, confirmLabel?: string) => {
    return new Promise((resolve) => {
      setState((prev) => {
        if (prev) {
          prevResolve.current = prev.resolve;
        }
        return { message, title, confirmLabel, resolve };
      });
    });
  }, []);

  const cleanup = useCallback(() => {
    unlockBody();
  }, []);

  useEffect(() => {
    if (!state) return;
    if (prevResolve.current) {
      prevResolve.current(false);
      prevResolve.current = null;
    }
    lockBody();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        state.resolve(false);
        setState(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      cleanup();
    };
  }, [state, cleanup]);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };
  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 2000 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{state.title || 'Confirm'}</h2>
              <button onClick={handleCancel} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: 'none', overflow: 'visible' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{state.message}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn" onClick={handleCancel} type="button">Cancel</button>
              <button className="btn btn-primary" onClick={handleConfirm} type="button" style={{ background: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)' }}>
                {state.confirmLabel || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
