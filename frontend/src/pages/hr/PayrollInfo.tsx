import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function PayrollInfo() {
  return <PlaceholderPage title="Payroll Info" description="Employee payroll information" module="hr" />;
}
