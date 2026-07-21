import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function AnimalGroups() {
  return <PlaceholderPage title="Animal Groups" description="Manage animal groups" module="animals" />;
}
