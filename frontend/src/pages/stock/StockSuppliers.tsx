import { lazy } from 'react';
const PlaceholderPage = lazy(() => import('../generated/PlaceholderPage'));
export default function StockSuppliers() {
  return <PlaceholderPage title="Stock Suppliers" description="Manage suppliers" module="stock" />;
}
