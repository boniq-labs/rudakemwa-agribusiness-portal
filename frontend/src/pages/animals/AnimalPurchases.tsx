import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function AnimalPurchases() {
  return <PlaceholderPage title="Animal Purchases" description="Record animal purchases" module="animals" />;
}
