import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function SalesReturns() {
  return <PlaceholderPage title="Returns" description="Manage returns" module="sales" />;
}
