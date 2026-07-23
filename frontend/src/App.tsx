import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// Dashboard
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Users
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));

// HR
const HRDashboard = lazy(() => import('./pages/hr/HRDashboard'));
const EmployeesPage = lazy(() => import('./pages/hr/EmployeesPage'));
const EmployeeProfile = lazy(() => import('./pages/hr/EmployeeProfile'));
const DepartmentsPage = lazy(() => import('./pages/hr/DepartmentsPage'));
const PositionsPage = lazy(() => import('./pages/hr/PositionsPage'));
const AttendancePage = lazy(() => import('./pages/hr/AttendancePage'));
const ContractsPage = lazy(() => import('./pages/hr/ContractsPage'));
const TrainingPage = lazy(() => import('./pages/hr/TrainingPage'));
const PerformancePage = lazy(() => import('./pages/hr/PerformancePage'));
const RecruitmentPage = lazy(() => import('./pages/hr/RecruitmentPage'));
const HRReports = lazy(() => import('./pages/hr/HRReports'));
const EmployeeActivitiesPage = lazy(() => import('./pages/hr/EmployeeActivitiesPage'));


// Animals
const AnimalDashboard = lazy(() => import('./pages/animals/AnimalDashboard'));
const AnimalRegistration = lazy(() => import('./pages/animals/AnimalRegistration'));
const AnimalCategories = lazy(() => import('./pages/animals/AnimalCategories'));
const AnimalBreeds = lazy(() => import('./pages/animals/AnimalBreeds'));
const BreedManagement = lazy(() => import('./pages/animals/BreedManagement'));
const Pigs = lazy(() => import('./pages/animals/Pigs'));
const Cattle = lazy(() => import('./pages/animals/Cattle'));
const Breeding = lazy(() => import('./pages/animals/Breeding'));
const Pregnancy = lazy(() => import('./pages/animals/Pregnancy'));
const BirthRecords = lazy(() => import('./pages/animals/BirthRecords'));
const Feeding = lazy(() => import('./pages/animals/Feeding'));
const WeightTracking = lazy(() => import('./pages/animals/WeightTracking'));
const Vaccination = lazy(() => import('./pages/animals/Vaccination'));
const DiseaseManagement = lazy(() => import('./pages/animals/DiseaseManagement'));
const Treatment = lazy(() => import('./pages/animals/Treatment'));
const AnimalSales = lazy(() => import('./pages/animals/AnimalSales'));
const AnimalDeaths = lazy(() => import('./pages/animals/AnimalDeaths'));
const AnimalReports = lazy(() => import('./pages/animals/AnimalReports'));
const AnimalProfile = lazy(() => import('./pages/animals/AnimalProfile'));
const ShiftManagement = lazy(() => import('./pages/animals/ShiftManagement'));

// Milk
const MilkDashboard = lazy(() => import('./pages/milk/MilkDashboard'));
const MilkProducts = lazy(() => import('./pages/milk/MilkProducts'));
const MilkCustomers = lazy(() => import('./pages/milk/MilkCustomers'));
const MilkReports = lazy(() => import('./pages/milk/MilkReports'));
const MorningProduction = lazy(() => import('./pages/milk/MorningProduction'));
const EveningProduction = lazy(() => import('./pages/milk/EveningProduction'));

// Stock
const StockDashboard = lazy(() => import('./pages/stock/StockDashboard'));
const FeedStock = lazy(() => import('./pages/stock/FeedStock'));
const MedicineStock = lazy(() => import('./pages/stock/MedicineStock'));
const EquipmentPage = lazy(() => import('./pages/stock/EquipmentPage'));
const StockReports = lazy(() => import('./pages/stock/StockReports'));
const StockCategories = lazy(() => import('./pages/stock/StockCategories'));

// Procurement
const ProcurementDashboard = lazy(() => import('./pages/procurement/ProcurementDashboard'));
const SuppliersPage = lazy(() => import('./pages/procurement/SuppliersPage'));
const PurchaseRequests = lazy(() => import('./pages/procurement/PurchaseRequests'));
const PurchaseOrders = lazy(() => import('./pages/procurement/PurchaseOrders'));
const ProcurementInvoices = lazy(() => import('./pages/procurement/ProcurementInvoices'));
const ProcurementContracts = lazy(() => import('./pages/procurement/ProcurementContracts'));
const ProcurementReports = lazy(() => import('./pages/procurement/ProcurementReports'));


// Logistics
const LogisticsDashboard = lazy(() => import('./pages/logistics/LogisticsDashboard'));
const VehiclesPage = lazy(() => import('./pages/logistics/VehiclesPage'));
const DriversPage = lazy(() => import('./pages/logistics/DriversPage'));
const TransportRequests = lazy(() => import('./pages/logistics/TransportRequests'));
const TripsPage = lazy(() => import('./pages/logistics/TripsPage'));
const DeliveriesPage = lazy(() => import('./pages/logistics/DeliveriesPage'));
const FuelPage = lazy(() => import('./pages/logistics/FuelPage'));
const MaintenancePage = lazy(() => import('./pages/logistics/MaintenancePage'));
const LogisticsReports = lazy(() => import('./pages/logistics/LogisticsReports'));

// Accounting
const AccountingDashboard = lazy(() => import('./pages/accounting/AccountingDashboard'));
const IncomePage = lazy(() => import('./pages/accounting/IncomePage'));
const ExpensesPage = lazy(() => import('./pages/accounting/ExpensesPage'));
const AccountingInvoices = lazy(() => import('./pages/accounting/AccountingInvoices'));
const BudgetsPage = lazy(() => import('./pages/accounting/BudgetsPage'));
const CashFlow = lazy(() => import('./pages/accounting/CashFlow'));
const AccountingReports = lazy(() => import('./pages/accounting/AccountingReports'));

// Sales
const SalesDashboard = lazy(() => import('./pages/sales/SalesDashboard'));
const CustomersPage = lazy(() => import('./pages/sales/CustomersPage'));
const ProductsPage = lazy(() => import('./pages/sales/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/sales/OrdersPage'));
const SalesInvoices = lazy(() => import('./pages/sales/SalesInvoices'));
const SalesReports = lazy(() => import('./pages/sales/SalesReports'));

// Veterinary
const VetDashboard = lazy(() => import('./pages/veterinary/VetDashboard'));
const HealthRecords = lazy(() => import('./pages/veterinary/HealthRecords'));
const VetVaccinations = lazy(() => import('./pages/veterinary/VetVaccinations'));
const TreatmentRecords = lazy(() => import('./pages/veterinary/TreatmentRecords'));
const Prescriptions = lazy(() => import('./pages/veterinary/Prescriptions'));

// Crop Production
const CropDashboard = lazy(() => import('./pages/crops/CropDashboard'));
const CropTypes = lazy(() => import('./pages/crops/CropTypes'));
const LandAreas = lazy(() => import('./pages/crops/LandAreas'));
const CropActivities = lazy(() => import('./pages/crops/CropActivities'));
const CropReports = lazy(() => import('./pages/crops/CropReports'));

// Employee
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const DailyReportPage = lazy(() => import('./pages/employee/DailyReportPage'));
const ReportReviewPage = lazy(() => import('./pages/manager/ReportReviewPage'));

// Account / utility
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 } },
});

function ProtectedRoute({ children, roles }: { children?: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role) && user.role !== 'owner' && user.role !== 'farm_owner') {
    return <div className="error-page"><h2>Access Denied</h2><p>You do not have permission to access this page.</p></div>;
  }
  return children ? <>{children}</> : <Outlet />;
}

function LoadingFallback() {
  return <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<ProtectedRoute roles={['owner', 'admin']}><UsersPage /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute roles={['owner', 'admin']}><RolesPage /></ProtectedRoute>} />

          {/* HR */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'hr']} />}>
            <Route path="hr/dashboard" element={<HRDashboard />} />
            <Route path="hr/employees" element={<EmployeesPage />} />
            <Route path="hr/employees/:id" element={<EmployeeProfile />} />
            <Route path="hr/departments" element={<DepartmentsPage />} />
            <Route path="hr/positions" element={<PositionsPage />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/contracts" element={<ContractsPage />} />
            <Route path="hr/training" element={<TrainingPage />} />
            <Route path="hr/performance" element={<PerformancePage />} />
            <Route path="hr/recruitment" element={<RecruitmentPage />} />
            <Route path="hr/reports" element={<HRReports />} />
            <Route path="hr/activities" element={<EmployeeActivitiesPage />} />
          </Route>

          {/* Animals */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'animal', 'veterinarian']} />}>
            <Route path="animals/dashboard" element={<AnimalDashboard />} />
            <Route path="animals/registration" element={<AnimalRegistration />} />
            <Route path="animals/categories" element={<AnimalCategories />} />
            <Route path="animals/breeds" element={<AnimalBreeds />} />
            <Route path="animals/breed-management" element={<BreedManagement />} />
            <Route path="animals/pigs" element={<Pigs />} />
            <Route path="animals/cattle" element={<Cattle />} />
            <Route path="animals/breeding" element={<Breeding />} />
            <Route path="animals/pregnancies" element={<Pregnancy />} />
            <Route path="animals/births" element={<BirthRecords />} />
            <Route path="animals/feeding" element={<Feeding />} />
            <Route path="animals/weights" element={<WeightTracking />} />
            <Route path="animals/vaccinations" element={<Vaccination />} />
            <Route path="animals/diseases" element={<DiseaseManagement />} />
            <Route path="animals/treatments" element={<Treatment />} />
            <Route path="animals/sales" element={<AnimalSales />} />
            <Route path="animals/deaths" element={<AnimalDeaths />} />
            <Route path="animals/shifts" element={<ShiftManagement />} />
            <Route path="animals/reports" element={<AnimalReports />} />
            <Route path="animals/profile/:id" element={<AnimalProfile />} />
          </Route>

          {/* Crops */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'crops']} />}>
            <Route path="crops/dashboard" element={<CropDashboard />} />
            <Route path="crops/types" element={<CropTypes />} />
            <Route path="crops/land" element={<LandAreas />} />
            <Route path="crops/activities" element={<CropActivities />} />
            <Route path="crops/reports" element={<CropReports />} />
          </Route>

          {/* Milk */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'milk']} />}>
            <Route path="milk/dashboard" element={<MilkDashboard />} />
            <Route path="milk/products" element={<MilkProducts />} />
            <Route path="milk/customers" element={<MilkCustomers />} />
            <Route path="milk/reports" element={<MilkReports />} />
            <Route path="milk/morning" element={<MorningProduction />} />
            <Route path="milk/evening" element={<EveningProduction />} />
          </Route>

          {/* Stock */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'stock']} />}>
            <Route path="stock/dashboard" element={<StockDashboard />} />
            <Route path="stock/feed" element={<FeedStock />} />
            <Route path="stock/medicines" element={<MedicineStock />} />
            <Route path="stock/equipment" element={<EquipmentPage />} />
            <Route path="stock/reports" element={<StockReports />} />
            <Route path="stock/categories" element={<StockCategories />} />

          </Route>

          {/* Procurement */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'procurement']} />}>
            <Route path="procurement/dashboard" element={<ProcurementDashboard />} />
            <Route path="procurement/suppliers" element={<SuppliersPage />} />
            <Route path="procurement/requests" element={<PurchaseRequests />} />
            <Route path="procurement/orders" element={<PurchaseOrders />} />
                        <Route path="procurement/invoices" element={<ProcurementInvoices />} />
            <Route path="procurement/contracts" element={<ProcurementContracts />} />
            <Route path="procurement/reports" element={<ProcurementReports />} />

          </Route>

          {/* Logistics */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'logistics']} />}>
            <Route path="logistics/dashboard" element={<LogisticsDashboard />} />
            <Route path="logistics/vehicles" element={<VehiclesPage />} />
            <Route path="logistics/drivers" element={<DriversPage />} />
            <Route path="logistics/requests" element={<TransportRequests />} />
            <Route path="logistics/trips" element={<TripsPage />} />
            <Route path="logistics/deliveries" element={<DeliveriesPage />} />
            <Route path="logistics/fuel" element={<FuelPage />} />
            <Route path="logistics/maintenance" element={<MaintenancePage />} />
            <Route path="logistics/reports" element={<LogisticsReports />} />
          </Route>

          {/* Accounting */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'accountant']} />}>
            <Route path="accounting/dashboard" element={<AccountingDashboard />} />
            <Route path="accounting/income" element={<IncomePage />} />
            <Route path="accounting/expenses" element={<ExpensesPage />} />
            <Route path="accounting/invoices" element={<AccountingInvoices />} />
            <Route path="accounting/budgets" element={<BudgetsPage />} />
            <Route path="accounting/cash-flow" element={<CashFlow />} />
            <Route path="accounting/reports" element={<AccountingReports />} />
          </Route>

          {/* Sales */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'sales']} />}>
            <Route path="sales/dashboard" element={<SalesDashboard />} />
            <Route path="sales/customers" element={<CustomersPage />} />
            <Route path="sales/products" element={<ProductsPage />} />
            <Route path="sales/orders" element={<OrdersPage />} />
            <Route path="sales/quotations" element={<Navigate to="/sales/orders" />} />
            <Route path="sales/invoices" element={<SalesInvoices />} />
            <Route path="sales/deliveries" element={<DeliveriesPage />} />
            <Route path="sales/reports" element={<SalesReports />} />
          </Route>

          {/* Veterinary */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'veterinarian']} />}>
            <Route path="veterinary/dashboard" element={<VetDashboard />} />
            <Route path="veterinary/health-records" element={<HealthRecords />} />
            <Route path="veterinary/vaccinations" element={<VetVaccinations />} />
            <Route path="veterinary/treatments" element={<TreatmentRecords />} />
            <Route path="veterinary/prescriptions" element={<Prescriptions />} />
          </Route>

          {/* Employee — accessible to all department roles */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'worker', 'hr', 'animal', 'veterinarian', 'milk', 'procurement', 'logistics', 'stock', 'sales', 'accountant', 'crops']} />}>
            <Route path="employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="employee/reports" element={<DailyReportPage />} />
          </Route>

          {/* Manager Report Review */}
          <Route element={<ProtectedRoute roles={['owner', 'admin', 'hr', 'animal', 'milk', 'stock', 'procurement', 'logistics', 'accountant', 'sales', 'veterinarian']} />}>
            <Route path="manager/reports" element={<ReportReviewPage />} />
          </Route>

          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          {showSplash ? (
            // Render ONLY the splash screen — no router, no auth spinner, nothing else.
            <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
          ) : (
            // Mount the full app AFTER the splash finishes.
            <AuthProvider key="app">
              <AppRoutes />
            </AuthProvider>
          )}
        </AnimatePresence>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
