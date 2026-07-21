import pool from '../config/database';
import { success, error } from '../utils/response';
export const getDashboard = async (req, res) => {
    try {
        const role = req.user.role;
        const { id: userId } = req.user;
        let data = {};
        switch (role) {
            case 'owner':
            case 'farm_owner':
                data = await getOwnerDashboard();
                break;
            case 'admin':
                data = await getAdminDashboard();
                break;
            case 'hr':
                data = await getHrDashboard();
                break;
            case 'accountant':
                data = await getAccountantDashboard();
                break;
            case 'animal':
            case 'veterinarian':
                data = await getAnimalDashboard();
                break;
            case 'milk':
                data = await getMilkDashboard();
                break;
            case 'stock':
                data = await getStockDashboard();
                break;
            case 'logistics':
                data = await getLogisticsDashboard();
                break;
            case 'procurement':
                data = await getProcurementDashboard();
                break;
            case 'sales':
                data = await getSalesDashboard();
                break;
            default: data = await getDefaultDashboard(userId);
        }
        const [notifications] = await pool.query('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10', [userId]);
        const [tasks] = await pool.query('SELECT * FROM tasks WHERE assigned_to_id = ? AND status != "completed" ORDER BY due_date ASC LIMIT 5', [userId]);
        const [[deptInfo]] = await pool.query(`
      SELECT d.name as department_name, u.first_name, u.last_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [userId]);
        const [[{ employeeCount }]] = await pool.query("SELECT COUNT(*) as employeeCount FROM employees WHERE deleted_at IS NULL AND status = 'active'");
        return success(res, {
            ...data, notifications, tasks,
            departmentInfo: {
                departmentName: deptInfo?.department_name || null,
                managerName: deptInfo ? `${deptInfo.first_name} ${deptInfo.last_name}`.trim() : null,
                employeeCount,
            },
        });
    }
    catch (err) {
        return error(res, err.message);
    }
};
async function getOwnerDashboard() {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE deleted_at IS NULL');
    const [[{ totalEmployees }]] = await pool.query("SELECT COUNT(*) as totalEmployees FROM employees WHERE deleted_at IS NULL AND status = 'active'");
    const [[{ totalAnimals }]] = await pool.query("SELECT COUNT(*) as totalAnimals FROM animals WHERE status='active'");
    const [[{ income }]] = await pool.query("SELECT COALESCE(SUM(total),0) as income FROM supplier_invoices WHERE status='paid' AND MONTH(created_at)=MONTH(CURDATE())");
    const [[{ expenses }]] = await pool.query("SELECT COALESCE(SUM(cost),0) as expenses FROM fuel_records WHERE MONTH(date)=MONTH(CURDATE())");
    const [[{ milk }]] = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as milk FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) as pendingOrders FROM purchase_orders WHERE status='draft' OR status='sent'");
    const [[{ lowStockItems }]] = await pool.query("SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= min_stock_level");
    const [recentActivities] = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10');
    return { totalUsers, totalEmployees, totalAnimals, monthlyIncome: income, monthlyExpenses: expenses, profit: income - expenses, milkToday: milk, pendingOrders, lowStockItems, recentActivities };
}
async function getAdminDashboard() {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users WHERE deleted_at IS NULL');
    const [[{ totalEmployees }]] = await pool.query("SELECT COUNT(*) as totalEmployees FROM employees WHERE deleted_at IS NULL AND status = 'active'");
    const [[{ totalAnimals }]] = await pool.query("SELECT COUNT(*) as totalAnimals FROM animals WHERE status='active'");
    const [[{ income }]] = await pool.query("SELECT COALESCE(SUM(amount),0) as income FROM income_records WHERE MONTH(date)=MONTH(CURDATE())");
    const [[{ expenses }]] = await pool.query("SELECT COALESCE(SUM(amount),0) as expenses FROM expense_records WHERE MONTH(date)=MONTH(CURDATE())");
    const [[{ milk }]] = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as milk FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
    const [[{ lowStockItems }]] = await pool.query("SELECT COUNT(*) as lowStockItems FROM inventory_items WHERE quantity <= min_stock_level");
    const [[{ feedItems }]] = await pool.query("SELECT COUNT(*) as feedItems FROM feed_items");
    const [[{ medItems }]] = await pool.query("SELECT COUNT(*) as medItems FROM medicine_items");
    const [[{ equipItems }]] = await pool.query("SELECT COUNT(*) as equipItems FROM equipment WHERE deleted_at IS NULL");
    const [[{ births }]] = await pool.query("SELECT COUNT(*) as births FROM birth_records WHERE MONTH(birth_date)=MONTH(CURDATE())");
    const [[{ pregnant }]] = await pool.query("SELECT COUNT(*) as pregnant FROM pregnancies WHERE status='confirmed'");
    const [[{ activeUsers }]] = await pool.query("SELECT COUNT(*) as activeUsers FROM users WHERE is_active=1 AND deleted_at IS NULL");
    const [recentActivities] = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10');
    return {
        totalUsers, totalEmployees, totalAnimals,
        monthlyIncome: income, monthlyExpenses: expenses, profit: income - expenses,
        milkToday: milk, lowStockItems, feedStock: feedItems, medicineStock: medItems,
        equipmentStock: equipItems, birthsThisMonth: births, pregnantAnimals: pregnant,
        activeUsers, recentActivities,
    };
}
async function getHrDashboard() {
    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM employees WHERE deleted_at IS NULL AND status = 'active'");
    const [[{ present }]] = await pool.query("SELECT COUNT(*) as present FROM attendance WHERE date=CURDATE() AND status='present'");
    const [[{ absent }]] = await pool.query("SELECT COUNT(*) as absent FROM attendance WHERE date=CURDATE() AND status='absent'");
    const [[{ pendingLeaves }]] = await pool.query("SELECT COUNT(*) as pendingLeaves FROM leave_requests WHERE status='pending'");
    const [expiring] = await pool.query("SELECT * FROM contracts WHERE end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status='active'");
    return { totalEmployees: total, presentToday: present, absentToday: absent, pendingLeaves, contractsExpiring: expiring.length };
}
async function getAccountantDashboard() {
    const [[{ todayIncome }]] = await pool.query("SELECT COALESCE(SUM(total),0) as todayIncome FROM receipts WHERE DATE(created_at)=CURDATE()");
    const [[{ todayExpense }]] = await pool.query("SELECT COALESCE(SUM(total),0) as todayExpense FROM supplier_invoices WHERE status='paid' AND DATE(created_at)=CURDATE()");
    const [[{ monthIncome }]] = await pool.query("SELECT COALESCE(SUM(total),0) as monthIncome FROM receipts WHERE MONTH(created_at)=MONTH(CURDATE())");
    const [[{ monthExpense }]] = await pool.query("SELECT COALESCE(SUM(amount),0) as monthExpense FROM expense_records WHERE MONTH(date)=MONTH(CURDATE())");
    return { incomeToday: todayIncome, expenseToday: todayExpense, monthlyIncome: monthIncome, monthlyExpenses: monthExpense, profit: monthIncome - monthExpense };
}
async function getAnimalDashboard() {
    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM animals WHERE status='active'");
    const [[{ female }]] = await pool.query("SELECT COUNT(*) as female FROM animals WHERE gender='female' AND status='active'");
    const [[{ male }]] = await pool.query("SELECT COUNT(*) as male FROM animals WHERE gender='male' AND status='active'");
    const [[{ pregnant }]] = await pool.query("SELECT COUNT(*) as pregnant FROM pregnancies WHERE status='confirmed' OR status='monitoring'");
    const [[{ vaccinationsDue }]] = await pool.query("SELECT COUNT(*) as vaccinationsDue FROM vaccinations WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
    const [[{ birthsThisMonth }]] = await pool.query("SELECT COUNT(*) as birthsThisMonth FROM birth_records WHERE MONTH(birth_date)=MONTH(CURDATE())");
    return { totalAnimals: total, totalFemale: female, totalMale: male, pregnantAnimals: pregnant, vaccinationsDue, birthsThisMonth };
}
async function getMilkDashboard() {
    const [[{ todayTotal }]] = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as todayTotal FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
    const [[{ morning }]] = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as morning FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='morning'");
    const [[{ evening }]] = await pool.query("SELECT COALESCE(SUM(quantity_liters),0) as evening FROM milk_collections WHERE DATE(collection_date)=CURDATE() AND time='evening'");
    const [[{ avgPerCow }]] = await pool.query("SELECT COALESCE(AVG(quantity_liters),0) as avgPerCow FROM milk_collections WHERE DATE(collection_date)=CURDATE()");
    return { milkToday: todayTotal, morningCollection: morning, eveningCollection: evening, averagePerCow: Math.round(avgPerCow * 100) / 100 };
}
async function getStockDashboard() {
    const [[{ totalItems }]] = await pool.query("SELECT COUNT(*) as totalItems FROM inventory_items WHERE deleted_at IS NULL");
    const [[{ lowStock }]] = await pool.query("SELECT COUNT(*) as lowStock FROM inventory_items WHERE quantity <= min_stock_level AND deleted_at IS NULL");
    const [recentTransactions] = await pool.query("SELECT * FROM stock_transactions ORDER BY created_at DESC LIMIT 10");
    return { totalItems, lowStockItems: lowStock, recentTransactions };
}
async function getLogisticsDashboard() {
    const [[{ active_transports }]] = await pool.query("SELECT COUNT(*) as active_transports FROM transport_requests WHERE status='approved'");
    const [[{ available_vehicles }]] = await pool.query("SELECT COUNT(*) as available_vehicles FROM vehicles WHERE status='available'");
    const [[{ active_drivers }]] = await pool.query("SELECT COUNT(*) as active_drivers FROM drivers WHERE status='available'");
    const [[{ pending_maintenance }]] = await pool.query("SELECT COUNT(*) as pending_maintenance FROM vehicle_maintenance WHERE next_service_date IS NOT NULL AND next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
    const [[{ trips_today }]] = await pool.query("SELECT COUNT(*) as trips_today FROM trips WHERE DATE(start_date)=CURDATE()");
    return { active_transports, available_vehicles, active_drivers, pending_maintenance, trips_today };
}
async function getProcurementDashboard() {
    const [[{ pending_requests }]] = await pool.query("SELECT COUNT(*) as pending_requests FROM purchase_requests WHERE status='pending'");
    const [[{ active_orders }]] = await pool.query("SELECT COUNT(*) as active_orders FROM purchase_orders WHERE status='sent' OR status='confirmed'");
    const [[{ total_suppliers }]] = await pool.query("SELECT COUNT(*) as total_suppliers FROM suppliers WHERE deleted_at IS NULL");
    const [[{ total_spent }]] = await pool.query("SELECT COALESCE(SUM(amount),0) as total_spent FROM supplier_invoices WHERE status='paid'");
    return { pending_requests, active_orders, total_suppliers, total_spent };
}
async function getSalesDashboard() {
    const [[{ todaySales }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) as todaySales FROM sales_orders WHERE DATE(order_date)=CURDATE() AND status='completed'");
    const [[{ monthSales }]] = await pool.query("SELECT COALESCE(SUM(total_amount),0) as monthSales FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND status='completed'");
    const [[{ pendingOrders }]] = await pool.query("SELECT COUNT(*) as pendingOrders FROM sales_orders WHERE status='pending'");
    return { todaySales, monthlySales: monthSales, pendingOrders };
}
async function getDefaultDashboard(userId) {
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE assigned_to_id = ? AND status IN ("pending","in_progress")', [userId]);
    const [employee] = await pool.query(`SELECT e.*, u.first_name, u.last_name, u.email, u.phone, u.photo,
            d.name as department_name, r.name as role_name
     FROM employees e JOIN users u ON e.user_id = u.id
     LEFT JOIN departments d ON u.department_id = d.id
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = ? AND u.deleted_at IS NULL`, [userId]);
    const [attendance] = await pool.query(`SELECT a.*, TIME(a.check_in) as check_in_time, TIME(a.check_out) as check_out_time
     FROM attendance a JOIN employees e ON a.employee_id = e.id
     WHERE e.user_id = ? AND a.date = CURDATE()`, [userId]);
    return { myTasks: tasks, profile: employee[0] || null, todayAttendance: attendance[0] || null };
}
// Resilient single-value query (never throws — returns fallback on any error)
async function val(sql, fallback = 0) {
    try {
        const [rows] = await pool.query(sql);
        if (Array.isArray(rows) && rows[0])
            return Object.values(rows[0])[0] ?? fallback;
        return fallback;
    }
    catch {
        return fallback;
    }
}
export const getDepartmentOverview = async (req, res) => {
    try {
        const overview = {
            hr: {
                employees: await val("SELECT COUNT(*) c FROM employees WHERE deleted_at IS NULL AND status = 'active'"),
                presentToday: await val("SELECT COUNT(*) c FROM attendance WHERE date=CURDATE() AND status='present'"),
                pendingLeaves: await val("SELECT COUNT(*) c FROM leave_requests WHERE status='pending'"),
            },
            animals: {
                total: await val("SELECT COUNT(*) c FROM animals WHERE status='active'"),
                pregnant: await val("SELECT COUNT(*) c FROM pregnancies WHERE status='confirmed' OR status='monitoring'"),
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
                openHealthRecords: await val("SELECT COUNT(*) c FROM veterinary_health_records WHERE status='open' OR status='active'"),
                vaccinationsDue: await val("SELECT COUNT(*) c FROM vet_vaccinations WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)"),
            },
        };
        overview.accounting.profit = Number(overview.accounting.monthIncome) - Number(overview.accounting.monthExpenses);
        return success(res, overview);
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=dashboardController.js.map