import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
