import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'efms',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    multipleStatements: true,
  });

  const hashed = await bcrypt.hash('rdkmw@', 12);

  // Departments
  const departments = [
    ['Management', 'Farm management and administration'],
    ['Human Resources', 'Employee management'],
    ['Finance', 'Accounting and finance'],
    ['Animal Production', 'Animal care and production'],
    ['Milk Production', 'Milk collection and processing'],
    ['Procurement', 'Purchasing and procurement'],
    ['Logistics', 'Transport and delivery'],
    ['Stock Management', 'Inventory management'],
    ['Sales', 'Sales and marketing'],
    ['Workers', 'General farm workers'],
    ['Veterinary', 'Veterinary services'],
    ['Crop Production', 'Crop cultivation and management'],
  ];
  for (const [name, desc] of departments) {
    await conn.query('INSERT IGNORE INTO departments (name, description) VALUES (?,?)', [name, desc]);
  }

  // Roles
  // Migrate old owner slug to farm_owner
  await conn.query('UPDATE roles SET slug = "farm_owner" WHERE slug = "owner"');

  const roles = [
    ['Farm Owner', 'farm_owner', 'Full system access'],
    ['System Administrator', 'admin', 'System administration'],
    ['HR Officer', 'hr', 'Human resources management'],
    ['Accountant', 'accountant', 'Financial management'],
    ['Animal Production Officer', 'animal', 'Animal management'],
    ['Veterinarian', 'veterinarian', 'Veterinary services'],
    ['Milk Production Officer', 'milk', 'Milk production'],
    ['Procurement Officer', 'procurement', 'Procurement'],
    ['Logistics Officer', 'logistics', 'Logistics and transport'],
    ['Stock Manager', 'stock', 'Stock management'],
    ['Sales Officer', 'sales', 'Sales'],
    ['Worker', 'worker', 'General worker'],
    ['Crop Production Officer', 'crops', 'Crop management'],
  ];
  for (const [name, slug, desc] of roles) {
    await conn.query('INSERT IGNORE INTO roles (name, slug, description, is_system) VALUES (?,?,?,?)', [name, slug, desc, 1]);
  }

  // Permissions
  const modules = [
    'users', 'employees', 'animals', 'milk', 'finance', 'stock', 'procurement', 'logistics', 'sales', 'reports', 'settings', 'notifications',
    'attendance', 'leave', 'contracts', 'training', 'performance', 'recruitment',
    'breeding', 'health', 'vaccination', 'feeding', 'weight',
    'milk_collection', 'milk_quality', 'milk_storage', 'milk_processing',
    'inventory', 'feed', 'medicine', 'equipment',
    'suppliers', 'purchase_requests', 'purchase_orders',
    'vehicles', 'drivers', 'transport', 'trips', 'fuel',
    'income', 'expenses', 'invoices', 'payments', 'payroll', 'budgets',
    'customers', 'products', 'orders', 'sales_invoices',
    'veterinary', 'treatment', 'documents', 'branches', 'dashboard',
    'crops',
  ];
  const actions = ['view', 'create', 'update', 'delete', 'approve', 'export'];
  for (const mod of modules) {
    for (const action of actions) {
      const slug = `${mod}.${action}`;
      const name = `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod.replace(/_/g, ' ')}`;
      await conn.query('INSERT IGNORE INTO permissions (name, slug, module) VALUES (?,?,?)', [name, slug, mod]);
    }
  }

  // Assign all permissions to farm owner role
  const [ownerRole] = await conn.query<any>('SELECT id FROM roles WHERE slug = "farm_owner"');
  const [allPerms] = await conn.query<any>('SELECT id FROM permissions');
  for (const p of allPerms) {
    await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [ownerRole[0].id, p.id]);
  }

  // Create farm owner user
  const [deptMgmt] = await conn.query<any>('SELECT id FROM departments WHERE name = "Management"');
  await conn.query('DELETE FROM users WHERE username IN ("owner","admin","ruda")');
  await conn.query(
    'INSERT INTO users (username, password, email, first_name, last_name, role_id, department_id) VALUES (?,?,?,?,?,?,?)',
    ['ruda', hashed, 'ruda@farm.com', 'Ruda', '', ownerRole[0].id, deptMgmt[0].id]
  );
  const [ownerUser] = await conn.query<any>('SELECT id FROM users WHERE username = "ruda"');
  await conn.query('INSERT IGNORE INTO employees (user_id, employee_code, position, date_hired) VALUES (?,?,?,CURDATE())',
    [ownerUser[0].id, 'RUDA001', 'Farm Owner']);

  // Assign specific permissions to other roles
  const rolePerms: Record<string, string[]> = {
    admin: ['users', 'employees', 'reports', 'settings', 'notifications', 'branches', 'documents', 'dashboard'],
    hr: ['employees', 'attendance', 'leave', 'contracts', 'training', 'performance', 'recruitment', 'documents', 'notifications'],
    accountant: ['finance', 'income', 'expenses', 'invoices', 'payments', 'payroll', 'budgets', 'reports', 'notifications'],
    animal: ['animals', 'breeding', 'health', 'vaccination', 'feeding', 'weight', 'notifications'],
    veterinarian: ['animals', 'health', 'vaccination', 'treatment', 'veterinary', 'notifications'],
    milk: ['milk', 'milk_collection', 'milk_quality', 'milk_storage', 'milk_processing', 'notifications'],
    procurement: ['procurement', 'suppliers', 'purchase_requests', 'purchase_orders', 'notifications'],
    logistics: ['logistics', 'vehicles', 'drivers', 'transport', 'trips', 'fuel', 'notifications'],
    stock: ['stock', 'inventory', 'feed', 'medicine', 'equipment', 'notifications'],
    sales: ['sales', 'customers', 'products', 'orders', 'sales_invoices', 'notifications'],
    worker: ['notifications', 'attendance'],
    crops: ['crops', 'notifications'],
  };

  // Clear and reassign role permissions (for idempotent seeding)
  for (const [slug] of Object.entries(rolePerms)) {
    const [role] = await conn.query<any>('SELECT id FROM roles WHERE slug = ?', [slug]);
    if (role.length > 0) {
      await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [role[0].id]);
    }
  }

  for (const [slug, mods] of Object.entries(rolePerms)) {
    const [role] = await conn.query<any>('SELECT id FROM roles WHERE slug = ?', [slug]);
    if (role.length === 0) continue;
    for (const mod of mods) {
      const actionList = slug === 'admin' ? actions : ['view', 'create', 'update'];
      for (const action of actionList) {
        const [perm] = await conn.query<any>('SELECT id FROM permissions WHERE slug = ?', [`${mod}.${action}`]);
        if (perm.length > 0) {
          await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [role[0].id, perm[0].id]);
        }
      }
    }
  }

  // Grant HR read-only access to users
  const [hrRole] = await conn.query<any>('SELECT id FROM roles WHERE slug = "hr"');
  if (hrRole.length > 0) {
    const [userViewPerm] = await conn.query<any>('SELECT id FROM permissions WHERE slug = "users.view"');
    if (userViewPerm.length > 0) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [hrRole[0].id, userViewPerm[0].id]);
    }
    const [userExportPerm] = await conn.query<any>('SELECT id FROM permissions WHERE slug = "users.export"');
    if (userExportPerm.length > 0) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)', [hrRole[0].id, userExportPerm[0].id]);
    }
  }

  console.log('Database seeded successfully!');
  console.log('Default login: ruda / rdkmw@');
  await conn.end();
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
