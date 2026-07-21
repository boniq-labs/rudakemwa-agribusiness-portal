import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function HRDocuments() {
  return <PlaceholderPage title="HR Documents" description="Manage HR documents" module="hr" />;
}
