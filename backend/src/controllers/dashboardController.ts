import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

// Reusable wrapper: calls the given dashboard fn, then attaches notifications/tasks/deptInfo
async function respondWithDashboard(req: AuthRequest, res: Response, dashboardFn: () => Promise<any>) {
  try {
    const data = await dashboardFn();
    const { id: userId } = req.user!;
    const [notifications]: any = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10', [userId]
    );
    const [tasks]: any = await pool.query(
      'SELECT * FROM tasks WHERE assigned_to_id = ? AND status != "completed" ORDER BY due_date ASC LIMIT 5', [userId]
    );
    const [[deptInfo]]: any = await pool.query(`
      SELECT d.name as department_name, u.first_name, u.last_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [userId]);
    const [[{ employeeCount }]]: any = await pool.query(
      "SELECT COUNT(*) as employeeCount FROM employees WHERE deleted_at IS NULL AND status = 'active'"
    );
    return success(res, {
      ...data, notifications, tasks,
      departmentInfo: {
        departmentName: deptInfo?.department_name || null,
        managerName: deptInfo ? `${deptInfo.first_name} ${deptInfo.last_name}`.trim() : null,
        employeeCount,
      },
    });
  } catch (err: any) { return error(res, err.message); }
}

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const { id: userId } = req.user!;
    let data: any = {};

    switch (role) {
      case 'owner': case 'farm_owner': data = await getOwnerDashboard(); break;
      case 'admin': data = await getAdminDashboard(); break;
      case 'hr': data = await getHrDashboard(); break;
      case 'accountant': data = await getAccountantDashboard(); break;
      case 'animal': case 'veterinarian': data = await getAnimalDashboard(); break;
      case 'milk': data = await getMilkDashboard(); break;
      case 'stock': data = await getStockDashboard(); break;
      case 'logistics': data = await getLogisticsDashboard(); break;
      case 'procurement': data = await getProcurementDashboard(); break;
      case 'sales': data = await getSalesDashboard(); break;
      default: data = await getDefaultDashboard(userId);
    }

    const [notifications]: any = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10', [userId]
    );
    const [tasks]: any = await pool.query(
      'SELECT * FROM tasks WHERE assigned_to_id = ? AND status != "completed" ORDER BY due_date ASC LIMIT 5', [userId]
    );

    const [[deptInfo]]: any = await pool.query(`
      SELECT d.name as department_name, u.first_name, u.last_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [userId]);

    const [[{ employeeCount }]]: any = await pool.query(
      "SELECT COUNT(*) as employeeCount FROM employees WHERE deleted_at IS NULL AND status = 'active'"
    );

    return success(res, {
      ...data, notifications, tasks,
      departmentInfo: {
        departmentName: deptInfo?.department_name || null,
        managerName: deptInfo ? `${deptInfo.first_name} ${deptInfo.last_name}`.trim() : null,
        employeeCount,
      },
    });
  } catch (err: any) { return error(res, err.message); }
};

async function getOwnerDashboard() {
  const [[{ totalUsers }]]: any = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE deleted_at IS NULL');
  const [[{ totalEmployees }]]: any = await pool.query("SELECT COUNT(*) as totalEmployees FROM employees WHERE deleted_at IS NULL AND status = 'active'");
  const [[{ totalAnimals }]]: any = await pool.query("SELECT COUNT(*) as totalAnimals FROM animals WHERE status='active' AND deleted_at IS NULL");
  const [[{ income }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as income FROM income_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ expenses }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as expenses FROM expense_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ milk }]]: any = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as milk FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
  const [[{ pendingOrders }]]: any = await pool.query("SELECT COUNT(*) as pendingOrders FROM purchase_orders WHERE status='draft' OR status='sent'");
  const [[{ lowStockItems }]]: any = await pool.query("SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= min_stock_level");
  const [recentActivities]: any = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10');
  return { totalUsers, totalEmployees, totalAnimals, monthlyIncome: income, monthlyExpenses: expenses, profit: income - expenses, milkToday: milk, pendingOrders, lowStockItems, recentActivities };
}

async function getAdminDashboard() {
  const [[{ totalUsers }]]: any = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE deleted_at IS NULL');
  const [[{ totalEmployees }]]: any = await pool.query("SELECT COUNT(*) as totalEmployees FROM employees WHERE deleted_at IS NULL AND status = 'active'");
  const [[{ totalAnimals }]]: any = await pool.query("SELECT COUNT(*) as totalAnimals FROM animals WHERE status='active' AND deleted_at IS NULL");
  const [[{ income }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as income FROM income_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ expenses }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as expenses FROM expense_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ milk }]]: any = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as milk FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
  const [[{ lowStockItems }]]: any = await pool.query("SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= min_stock_level");
  const [[{ feedItems }]]: any = await pool.query("SELECT COUNT(*) as feedItems FROM feed_items");
  const [[{ medItems }]]: any = await pool.query("SELECT COUNT(*) as medItems FROM medicine_items");
  const [[{ equipItems }]]: any = await pool.query("SELECT COUNT(*) as equipItems FROM equipment WHERE deleted_at IS NULL");
  const [[{ births }]]: any = await pool.query("SELECT COUNT(*) as births FROM birth_records WHERE MONTH(birth_date)=MONTH(CURDATE())");
  const [[{ pregnant }]]: any = await pool.query("SELECT COUNT(*) as pregnant FROM pregnancies WHERE status='confirmed'");
  const [[{ activeUsers }]]: any = await pool.query("SELECT COUNT(*) as activeUsers FROM users WHERE is_active=1 AND deleted_at IS NULL");
  const [recentActivities]: any = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10');
  return {
    totalUsers, totalEmployees, totalAnimals,
    monthlyIncome: income, monthlyExpenses: expenses, profit: income - expenses,
    milkToday: milk, lowStockItems, feedStock: feedItems, medicineStock: medItems,
    equipmentStock: equipItems, birthsThisMonth: births, pregnantAnimals: pregnant,
    activeUsers, recentActivities,
  };
}

async function getHrDashboard() {
  const [[{ total }]]: any = await pool.query("SELECT COUNT(*) as total FROM employees WHERE deleted_at IS NULL AND status = 'active'");
  const [[{ present }]]: any = await pool.query("SELECT COUNT(*) as present FROM attendance WHERE date=CURDATE() AND status='present'");
  const [[{ absent }]]: any = await pool.query("SELECT COUNT(*) as absent FROM attendance WHERE date=CURDATE() AND status='absent'");
  const [[{ pendingLeaves }]]: any = await pool.query("SELECT COUNT(*) as pendingLeaves FROM leave_requests WHERE status='pending'");
  const [expiring]: any = await pool.query("SELECT * FROM contracts WHERE end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status='active'");
  return { totalEmployees: total, presentToday: present, absentToday: absent, pendingLeaves, contractsExpiring: expiring.length };
}

async function getAccountantDashboard() {
  const [[{ totalMonthlyIncome }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as totalMonthlyIncome FROM income_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ totalMonthlyExpenses }]]: any = await pool.query("SELECT COALESCE(SUM(amount),0) as totalMonthlyExpenses FROM expense_records WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE()) AND deleted_at IS NULL");
  const [[{ totalInvoices }]]: any = await pool.query("SELECT COUNT(*) as totalInvoices FROM invoices");
  const [incomeVsExpenses]: any = await pool.query(
    "SELECT DATE_FORMAT(m.date,'%b') as month, COALESCE(SUM(i.amount),0) as income, COALESCE(SUM(e.amount),0) as expenses FROM (SELECT DISTINCT LAST_DAY(DATE_ADD(CURDATE(), INTERVAL -n MONTH)) as date FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d) m LEFT JOIN income_records i ON MONTH(i.date)=MONTH(m.date) AND YEAR(i.date)=YEAR(m.date) LEFT JOIN expense_records e ON MONTH(e.date)=MONTH(m.date) AND YEAR(e.date)=YEAR(m.date) GROUP BY m.date ORDER BY m.date"
  );
  const [expenseByCategory]: any = await pool.query(
    "SELECT ec.name, COALESCE(SUM(e.amount),0) as value FROM expense_categories ec LEFT JOIN expense_records e ON e.category_id = ec.id AND MONTH(e.date)=MONTH(CURDATE()) AND YEAR(e.date)=YEAR(CURDATE()) GROUP BY ec.id, ec.name"
  );
  return { totalMonthlyIncome, totalMonthlyExpenses, totalInvoices, profit: totalMonthlyIncome - totalMonthlyExpenses, incomeVsExpenses, expenseByCategory };
}

async function getAnimalDashboard() {
  const [[{ total }]]: any = await pool.query("SELECT COUNT(*) as total FROM animals WHERE status='active' AND deleted_at IS NULL");
  const [[{ female }]]: any = await pool.query("SELECT COUNT(*) as female FROM animals WHERE gender='female' AND status='active' AND deleted_at IS NULL");
  const [[{ male }]]: any = await pool.query("SELECT COUNT(*) as male FROM animals WHERE gender='male' AND status='active' AND deleted_at IS NULL");
  const [[{ cattle }]]: any = await pool.query("SELECT COUNT(*) as cattle FROM animals a JOIN animal_categories ac ON a.animal_category_id = ac.id WHERE LOWER(TRIM(ac.name)) = 'cattle' AND a.status='active' AND a.deleted_at IS NULL AND ac.deleted_at IS NULL");
  const [[{ pigs }]]: any = await pool.query("SELECT COUNT(*) as pigs FROM animals a JOIN animal_categories ac ON a.animal_category_id = ac.id WHERE LOWER(TRIM(ac.name)) IN ('pigs','pig') AND a.status='active' AND a.deleted_at IS NULL AND ac.deleted_at IS NULL");
  const [[{ pregnant }]]: any = await pool.query("SELECT COUNT(*) as pregnant FROM pregnancies p JOIN animals a ON p.animal_id = a.id WHERE p.status = 'Pregnant' AND p.deleted_at IS NULL AND a.deleted_at IS NULL");
  const [[{ sick }]]: any = await pool.query("SELECT COUNT(DISTINCT t.animal_id) as sick FROM treatments t JOIN animals a ON t.animal_id = a.id WHERE t.deleted_at IS NULL AND a.deleted_at IS NULL");
  const [[{ vaccinationsDue }]]: any = await pool.query("SELECT COUNT(*) as vaccinationsDue FROM vaccinations WHERE next_due_date <= CURDATE() AND deleted_at IS NULL");
  const [[{ births }]]: any = await pool.query("SELECT COUNT(*) as births FROM birth_records WHERE deleted_at IS NULL");
  const [[{ deaths }]]: any = await pool.query("SELECT COUNT(*) as deaths FROM animal_deaths WHERE deleted_at IS NULL");
  return { totalAnimals: total, totalFemale: female, totalMale: male, totalCattle: cattle, totalPigs: pigs, pregnantAnimals: pregnant, sickAnimals: sick, vaccinationsDue, totalBirths: births, totalDeaths: deaths };
}

async function getMilkDashboard() {
  const [[{ todayTotal }]]: any = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as todayTotal FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
  const [[{ morning }]]: any = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as morning FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='morning'");
  const [[{ evening }]]: any = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as evening FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='evening'");
  const [[{ avgPerCow }]]: any = await pool.query("SELECT COALESCE(AVG(quantity_liters),0) as avgPerCow FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
  const [[{ todayRevenue }]]: any = await pool.query("SELECT COALESCE(SUM(cp.amount),0) as todayRevenue FROM customer_payments cp WHERE DATE(cp.created_at)=CURDATE()");
  return { milkToday: todayTotal, morningCollection: morning, eveningCollection: evening, averagePerCow: Math.round(avgPerCow * 100) / 100, todayRevenue };
}

async function getStockDashboard() {
  const [[{ totalFeed }]]: any = await pool.query("SELECT COUNT(*) as totalFeed FROM feed_items WHERE deleted_at IS NULL");
  const [[{ totalMedicine }]]: any = await pool.query("SELECT COUNT(*) as totalMedicine FROM medicine_items WHERE deleted_at IS NULL");
  const [[{ totalEquipment }]]: any = await pool.query("SELECT COUNT(*) as totalEquipment FROM equipment WHERE deleted_at IS NULL");
  const [[{ lowFeed }]]: any = await pool.query("SELECT COUNT(*) as lowFeed FROM feed_items WHERE deleted_at IS NULL AND quantity <= COALESCE(min_stock_level,0)");
  const [[{ lowMedicine }]]: any = await pool.query("SELECT COUNT(*) as lowMedicine FROM medicine_items WHERE deleted_at IS NULL AND quantity <= COALESCE(reorder_level,0)");
  const [[{ lowEquipment }]]: any = await pool.query("SELECT COUNT(*) as lowEquipment FROM equipment WHERE deleted_at IS NULL AND quantity <= COALESCE(min_stock_level,0)");
  const [recentFeed]: any = await pool.query("SELECT id, name, quantity, 'feed' as type, created_at FROM feed_items WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5");
  const [recentMedicine]: any = await pool.query("SELECT id, name, quantity, 'medicine' as type, created_at FROM medicine_items WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5");
  const [recentEquipment]: any = await pool.query("SELECT id, name, quantity, 'equipment' as type, created_at FROM equipment WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5");
  const totalStockItems = totalFeed + totalMedicine + totalEquipment;
  const lowStockItems = lowFeed + lowMedicine + lowEquipment;
  return { totalFeedItems: totalFeed, totalMedicineItems: totalMedicine, totalEquipmentItems: totalEquipment, totalStockItems, lowStockItems, recentFeed, recentMedicine, recentEquipment };
}

async function getLogisticsDashboard() {
  const [[{ total_vehicles }]]: any = await pool.query("SELECT COUNT(*) as total_vehicles FROM vehicles WHERE deleted_at IS NULL");
  const [[{ total_drivers }]]: any = await pool.query("SELECT COUNT(*) as total_drivers FROM drivers WHERE deleted_at IS NULL");
  const [[{ total_requests }]]: any = await pool.query("SELECT COUNT(*) as total_requests FROM transport_requests WHERE deleted_at IS NULL");
  const [[{ total_trips }]]: any = await pool.query("SELECT COUNT(*) as total_trips FROM trips WHERE deleted_at IS NULL");
  const [[{ total_maintenance }]]: any = await pool.query("SELECT COUNT(*) as total_maintenance FROM vehicle_maintenance WHERE deleted_at IS NULL");
  const [[{ total_deliveries }]]: any = await pool.query("SELECT COUNT(*) as total_deliveries FROM deliveries WHERE deleted_at IS NULL");
  return { total_vehicles, total_drivers, total_requests, total_trips, total_maintenance, total_deliveries };
}

async function getProcurementDashboard() {
  const [[{ total_purchase_requests }]]: any = await pool.query("SELECT COUNT(*) as total_purchase_requests FROM purchase_requests WHERE deleted_at IS NULL");
  const [[{ total_purchase_orders }]]: any = await pool.query("SELECT COUNT(*) as total_purchase_orders FROM purchase_orders WHERE deleted_at IS NULL");
  const [[{ total_contracts }]]: any = await pool.query("SELECT COUNT(*) as total_contracts FROM supplier_contracts WHERE deleted_at IS NULL");
  const [[{ total_invoices }]]: any = await pool.query("SELECT COUNT(*) as total_invoices FROM supplier_invoices WHERE deleted_at IS NULL");
  const [recent_orders]: any = await pool.query("SELECT po.*, s.supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.deleted_at IS NULL ORDER BY po.created_at DESC LIMIT 5");
  return { total_purchase_requests, total_purchase_orders, total_contracts, total_invoices, recent_orders };
}

async function getSalesDashboard() {
  const [[{ todaySales }]]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as todaySales FROM sales_orders WHERE DATE(order_date)=CURDATE() AND status='completed'");
  const [[{ monthSales }]]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as monthSales FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND status='completed'");
  const [[{ pendingOrders }]]: any = await pool.query("SELECT COUNT(*) as pendingOrders FROM sales_orders WHERE status='pending'");
  return { todaySales, monthlySales: monthSales, pendingOrders };
}

async function getDefaultDashboard(userId: number) {
  const [tasks]: any = await pool.query('SELECT * FROM tasks WHERE assigned_to_id = ? AND status IN ("pending","in_progress")', [userId]);

  const [employee]: any = await pool.query(
    `SELECT e.*, u.first_name, u.last_name, u.email, u.phone, u.photo,
            d.name as department_name, r.name as role_name
     FROM employees e JOIN users u ON e.user_id = u.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND u.deleted_at IS NULL`,
    [userId]
  );

  const [attendance]: any = await pool.query(
    `SELECT a.*, TIME(a.check_in) as check_in_time, TIME(a.check_out) as check_out_time
     FROM attendance a JOIN employees e ON a.employee_id = e.id
     WHERE e.user_id = ? AND a.date = CURDATE()`,
    [userId]
  );

  return { myTasks: tasks, profile: employee[0] || null, todayAttendance: attendance[0] || null };
}

// Resilient single-value query (never throws — returns fallback on any error)
async function val(sql: string, fallback: any = 0): Promise<any> {
  try {
    const [rows]: any = await pool.query(sql);
    if (Array.isArray(rows) && rows[0]) return Object.values(rows[0])[0] ?? fallback;
    return fallback;
  } catch {
    return fallback;
  }
}

export const getDepartmentOverview = async (req: AuthRequest, res: Response) => {
  try {
    const overview: any = {
      hr: {
        employees: await val("SELECT COUNT(*) c FROM employees WHERE deleted_at IS NULL AND status = 'active'"),
        presentToday: await val("SELECT COUNT(*) c FROM attendance WHERE date=CURDATE() AND status='present'"),
        pendingLeaves: await val("SELECT COUNT(*) c FROM leave_requests WHERE status='pending'"),
      },
      animals: {
        total: await val("SELECT COUNT(*) c FROM animals WHERE status='active' AND deleted_at IS NULL"),
        pregnant: await val("SELECT COUNT(*) c FROM pregnancies WHERE status = 'Pregnant' AND deleted_at IS NULL"),
        vaccinationsDue: await val("SELECT COUNT(*) c FROM vaccinations WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)"),
      },
      crops: {
        totalCropTypes: await val("SELECT COUNT(*) c FROM crop_types WHERE deleted_at IS NULL"),
        totalLandAreas: await val("SELECT COUNT(*) c FROM land_areas WHERE deleted_at IS NULL"),
        planted: await val("SELECT COUNT(*) c FROM crop_activities WHERE deleted_at IS NULL AND status='planted'"),
        harvested: await val("SELECT COUNT(*) c FROM crop_activities WHERE deleted_at IS NULL AND status='harvested'"),
      },
      milk: {
        today: await val("SELECT COALESCE(SUM(quantity_liters),0) c FROM milk_collections WHERE DATE(collection_date)=CURDATE()"),
        morning: await val("SELECT COALESCE(SUM(quantity_liters),0) c FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='morning'"),
        evening: await val("SELECT COALESCE(SUM(quantity_liters),0) c FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='evening'"),
      },
      stock: {
        totalItems: await val("SELECT COUNT(*) c FROM inventory_items WHERE deleted_at IS NULL"),
        lowStock: await val("SELECT COUNT(*) c FROM inventory_items WHERE quantity <= min_stock_level AND deleted_at IS NULL"),
      },
      procurement: {
        pendingRequests: await val("SELECT COUNT(*) c FROM purchase_requests WHERE status='pending'"),
        activeOrders: await val("SELECT COUNT(*) c FROM purchase_orders WHERE status='sent' OR status='confirmed'"),
        suppliers: await val("SELECT COUNT(*) c FROM suppliers WHERE deleted_at IS NULL"),
      },
      logistics: {
        activeRequests: await val("SELECT COUNT(*) c FROM transport_requests WHERE status='approved'"),
        activeTrips: await val("SELECT COUNT(*) c FROM trips WHERE status='in-progress' OR status='started'"),
        availableVehicles: await val("SELECT COUNT(*) c FROM vehicles WHERE status='available'"),
      },
      accounting: {
        monthIncome: await val("SELECT COALESCE(SUM(total),0) c FROM receipts WHERE MONTH(created_at)=MONTH(CURDATE())"),
        monthExpenses: await val("SELECT COALESCE(SUM(amount),0) c FROM expense_records WHERE MONTH(date)=MONTH(CURDATE())"),
      },
      sales: {
        monthSales: await val("SELECT COALESCE(SUM(total_amount),0) c FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND status='completed'"),
        pendingOrders: await val("SELECT COUNT(*) c FROM sales_orders WHERE status='pending'"),
      },
      veterinary: {
        openHealthRecords: await val("SELECT COUNT(*) c FROM animal_health_records WHERE status='open' OR status='active'"),
        vaccinationsDue: await val("SELECT COUNT(*) c FROM vaccination_records WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)"),
      },
    };
    overview.accounting.profit = Number(overview.accounting.monthIncome) - Number(overview.accounting.monthExpenses);
    return success(res, overview);
  } catch (err: any) {
    return error(res, err.message);
  }
};

// Individual dashboard handlers (used by /dashboard/:module routes so any admin can see the specific dashboard)
export const getHrDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getHrDashboard);
export const getAnimalDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getAnimalDashboard);
export const getMilkDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getMilkDashboard);
export const getStockDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getStockDashboard);
export const getProcurementDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getProcurementDashboard);
export const getLogisticsDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getLogisticsDashboard);
export const getAccountingDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getAccountantDashboard);
export const getSalesDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getSalesDashboard);
export const getVetDashboardHandler = async (req: AuthRequest, res: Response) => respondWithDashboard(req, res, getAnimalDashboard);
