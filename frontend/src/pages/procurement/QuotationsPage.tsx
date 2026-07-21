import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function QuotationsPage() {
  return <PlaceholderPage title="Quotations" description="Manage purchase quotations" module="procurement" />;
}
