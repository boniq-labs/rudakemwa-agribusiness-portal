export const ROLES = ['owner', 'admin', 'hr', 'accountant', 'animal', 'veterinarian', 'milk', 'procurement', 'logistics', 'stock', 'sales', 'worker'] as const;

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Farm Owner',
  admin: 'System Administrator',
  hr: 'HR Officer',
  accountant: 'Accountant',
  animal: 'Animal Production Manager',
  veterinarian: 'Veterinarian',
  milk: 'Milk Production Manager',
  procurement: 'Procurement Officer',
  logistics: 'Logistics Officer',
  stock: 'Stock Manager',
  sales: 'Sales Officer',
  crops: 'Crop Production Manager',
  worker: 'Employee',
};

export const DEPARTMENT_ROLES = [
  'hr', 'accountant', 'animal', 'veterinarian', 'milk',
  'procurement', 'logistics', 'stock', 'sales', 'crops',
] as const;

export const DEPARTMENT_ROLE_ROUTES: Record<string, string> = {
  hr: '/hr/dashboard',
  animal: '/animals/dashboard',
  milk: '/milk/dashboard',
  stock: '/stock/dashboard',
  procurement: '/procurement/dashboard',
  logistics: '/logistics/dashboard',
  accountant: '/accounting/dashboard',
  sales: '/sales/dashboard',
  veterinarian: '/veterinary/dashboard',
};

export const DEPARTMENT_NAMES = [
  'Management', 'Human Resources', 'Finance', 'Animal Production',
  'Milk Production', 'Procurement', 'Logistics', 'Stock Management', 'Sales', 'Workers',
  'Veterinary',
];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;
