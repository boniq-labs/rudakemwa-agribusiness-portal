import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import { settingsApi } from '../api';
import { cn } from '../utils/cn';
import {
  LayoutDashboard, Users, UserCircle, UserCheck, DollarSign, ShoppingCart,
  Truck, Package, PawPrint, Milk, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight,
  Stethoscope,
  Sprout,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: any;
  path?: string;
  roles?: string[];
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['owner', 'admin', 'hr', 'accountant', 'animal', 'veterinarian', 'milk', 'procurement', 'logistics', 'stock', 'sales'] },
  { label: 'Users', icon: Users, path: '/users', roles: ['owner', 'admin'] },
  { label: 'Roles', icon: UserCheck, path: '/roles', roles: ['owner', 'admin'] },
  {
    label: 'HR', icon: UserCircle, roles: ['owner', 'admin', 'hr'], children: [
      { label: 'Dashboard', path: '/hr/dashboard' },
      { label: 'Employees', path: '/hr/employees' },
      { label: 'Departments', path: '/hr/departments' },
      { label: 'Positions', path: '/hr/positions' },
      { label: 'Attendance', path: '/hr/attendance' },
      { label: 'Recruitment', path: '/hr/recruitment' },
      { label: 'Contracts', path: '/hr/contracts' },
      { label: 'Training', path: '/hr/training' },
      { label: 'Performance', path: '/hr/performance' },
      { label: 'Reports', path: '/hr/reports' },
      { label: 'Employee Activities', path: '/hr/activities' },
    ],
  },
  {
    label: 'Animal Production', icon: PawPrint, roles: ['owner', 'admin', 'animal', 'veterinarian'], children: [
      { label: 'Dashboard', path: '/animals/dashboard' },
      { label: 'Pigs', path: '/animals/pigs' },
      { label: 'Cattle', path: '/animals/cattle' },
      { label: 'Animal Registration', path: '/animals/registration' },
      { label: 'Categories', path: '/animals/categories' },
      { label: 'Breeds', path: '/animals/breeds' },
      { label: 'Breed Management', path: '/animals/breed-management' },

      { label: 'Breeding Management', path: '/animals/breeding' },
      { label: 'Pregnancy Tracking', path: '/animals/pregnancies' },
      { label: 'Birth Records', path: '/animals/births' },
      { label: 'Feeding Management', path: '/animals/feeding' },

      { label: 'Weight Tracking', path: '/animals/weights' },
      { label: 'Vaccination', path: '/animals/vaccinations' },
      { label: 'Disease Management', path: '/animals/diseases' },
      { label: 'Treatment Records', path: '/animals/treatments' },
      { label: 'Animal Sale', path: '/animals/sales' },
      { label: 'Animal Death', path: '/animals/deaths' },
      { label: 'Shift Management', path: '/animals/shifts' },
      { label: 'Reports', path: '/animals/reports' },
    ],
  },
  {
    label: 'Crop Production', icon: Sprout, roles: ['owner', 'admin', 'crops'], children: [
      { label: 'Dashboard', path: '/crops/dashboard' },
      { label: 'Crop Types', path: '/crops/types' },
      { label: 'Land Areas', path: '/crops/land' },
      { label: 'Crop Activities', path: '/crops/activities' },
      { label: 'Reports', path: '/crops/reports' },
    ],
  },
  {
    label: 'Milk Production', icon: Milk, roles: ['owner', 'admin', 'milk'], children: [
      { label: 'Dashboard', path: '/milk/dashboard' },
      { label: 'Morning Production', path: '/milk/morning' },
      { label: 'Evening Production', path: '/milk/evening' },
      { label: 'Milk Products', path: '/milk/products' },
      { label: 'Customers', path: '/milk/customers' },
      { label: 'Daily Reports', path: '/milk/reports' },
    ],
  },
  {
    label: 'Stock Management', icon: Package, roles: ['owner', 'admin', 'stock'], children: [
      { label: 'Dashboard', path: '/stock/dashboard' },
      { label: 'Feed Stock', path: '/stock/feed' },
      { label: 'Medicine Stock', path: '/stock/medicines' },
      { label: 'Equipment Stock', path: '/stock/equipment' },
      { label: 'Categories', path: '/stock/categories' },
      { label: 'Reports', path: '/stock/reports' },
    ],
  },
  {
    label: 'Procurement', icon: ShoppingCart, roles: ['owner', 'admin', 'procurement'], children: [
      { label: 'Dashboard', path: '/procurement/dashboard' },
      { label: 'Suppliers', path: '/procurement/suppliers' },
      { label: 'Purchase Requests', path: '/procurement/requests' },
      { label: 'Purchase Orders', path: '/procurement/orders' },
      { label: 'Invoices', path: '/procurement/invoices' },
      { label: 'Contracts', path: '/procurement/contracts' },
      { label: 'Reports', path: '/procurement/reports' },
    ],
  },
  {
    label: 'Logistics', icon: Truck, roles: ['owner', 'admin', 'logistics'], children: [
      { label: 'Dashboard', path: '/logistics/dashboard' },
      { label: 'Transport Requests', path: '/logistics/requests' },
      { label: 'Vehicles', path: '/logistics/vehicles' },
      { label: 'Drivers', path: '/logistics/drivers' },
      { label: 'Trips', path: '/logistics/trips' },
      { label: 'Deliveries', path: '/logistics/deliveries' },
      { label: 'Fuel Management', path: '/logistics/fuel' },
      { label: 'Maintenance', path: '/logistics/maintenance' },
      { label: 'Reports', path: '/logistics/reports' },
    ],
  },
  {
    label: 'Accounting', icon: DollarSign, roles: ['owner', 'admin', 'accountant'], children: [
      { label: 'Dashboard', path: '/accounting/dashboard' },
      { label: 'Income', path: '/accounting/income' },
      { label: 'Expenses', path: '/accounting/expenses' },
      { label: 'Invoices', path: '/accounting/invoices' },
      { label: 'Budgets', path: '/accounting/budgets' },
      { label: 'Cash Flow', path: '/accounting/cash-flow' },
      { label: 'Reports', path: '/accounting/reports' },
    ],
  },
  {
    label: 'Sales', icon: ShoppingCart, roles: ['owner', 'admin', 'sales'], children: [
      { label: 'Dashboard', path: '/sales/dashboard' },
      { label: 'Customers', path: '/sales/customers' },
      { label: 'Products', path: '/sales/products' },
      { label: 'Orders', path: '/sales/orders' },
      { label: 'Quotations', path: '/sales/quotations' },
      { label: 'Invoices', path: '/sales/invoices' },
      { label: 'Deliveries', path: '/sales/deliveries' },
      { label: 'Reports', path: '/sales/reports' },
    ],
  },
  {
    label: 'Veterinary', icon: Stethoscope, roles: ['owner', 'admin', 'veterinarian'], children: [
      { label: 'Dashboard', path: '/veterinary/dashboard' },
      { label: 'Health Records', path: '/veterinary/health-records' },
      { label: 'Vaccinations', path: '/veterinary/vaccinations' },
      { label: 'Treatment Records', path: '/veterinary/treatments' },
      { label: 'Prescriptions', path: '/veterinary/prescriptions' },
    ],
  },
  {
    label: 'Employee', icon: UserCircle, roles: ['owner', 'admin', 'worker', 'hr', 'animal', 'veterinarian', 'milk', 'procurement', 'logistics', 'stock', 'sales', 'accountant', 'crops'], children: [
      { label: 'My Dashboard', path: '/employee/dashboard' },
    ],
  },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['owner', 'admin'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [farmLogo, setFarmLogo] = useState('/assets/logo.png');
  const [systemName, setSystemName] = useState('Portal');

  useEffect(() => {
    settingsApi.get().then((r) => {
      const s = r.data.data || {};
      if (s.farm_logo) setFarmLogo(s.farm_logo);
      if (s.system_name) setSystemName(s.system_name);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((v) => !v);

  // Listen for toggle event from Topbar hamburger
  useEffect(() => {
    const handler = () => toggleMobile();
    window.addEventListener('sidebar:toggle', handler);
    return () => window.removeEventListener('sidebar:toggle', handler);
  }, []);

  // Close mobile drawer on route change
  const prevLoc = useRef(location.pathname);
  useEffect(() => {
    if (prevLoc.current !== location.pathname) {
      setMobileOpen(false);
      prevLoc.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <>
      <div className={cn('sidebar-backdrop', mobileOpen && 'open')} onClick={closeMobile} />
      <aside className={cn('sidebar', collapsed && 'collapsed', mobileOpen && 'open')}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo"><img src={farmLogo} alt={systemName} className="w-full h-full object-contain" /></div>
            {!collapsed && <span className="sidebar-title">{systemName}</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => { setCollapsed(!collapsed); setMobileOpen(true); }}>
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((item) => {
              if (!item.roles) return true;
              if (['owner', 'farm_owner', 'admin'].includes(user?.role || '')) return true;
              return item.roles.includes(user?.role || '');
            })
            .map((item) => (
              <NavItemComponent
                key={item.label}
                item={item}
                collapsed={collapsed}
                location={location}
                navigate={navigate}
              />
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="sidebar-user-role">
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function NavItemComponent({
  item,
  collapsed,
  location,
  navigate,
}: {
  item: NavItem;
  collapsed: boolean;
  location: any;
  navigate: any;
}) {
  const [open, setOpen] = useState(false);
  const isActive = item.children
    ? item.children.some((c) => location.pathname === c.path)
    : location.pathname === item.path;

  if (item.children) {
    return (
      <div className={cn('nav-item', isActive && 'active')}>
        <button
          className="nav-link"
          onClick={() => {
            if (collapsed) navigate(item.children![0].path);
            else setOpen(!open);
          }}
        >
          <item.icon size={20} />
          {!collapsed && <span className="flex-1">{item.label}</span>}
          {!collapsed && (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </button>
        {open && !collapsed && (
          <div className="sub-nav">
            {item.children.map((child) => (
              <Link
                key={child.path}
                to={child.path}
                className={cn('sub-link', location.pathname === child.path && 'active')}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path!}
      className={cn('nav-item nav-link', isActive && 'active')}
    >
      <item.icon size={20} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}
