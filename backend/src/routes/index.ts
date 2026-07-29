import { Router } from 'express';
import { authenticate, authorize, hasRole } from '../middlewares/auth';
import { validate } from '../utils/validate';
import { loginSchema, changePasswordSchema, refreshTokenSchema, createUserSchema, updateUserSchema } from '../validators';
import {
  createPositionSchema, createAttendanceSchema, createLeaveTypeSchema, createLeaveRequestSchema,
  createContractSchema, updateContractSchema, createPerformanceReviewSchema, createTrainingSchema,
  createJobSchema, createApplicantSchema, createAnimalCategorySchema, createAnimalSchema, updateAnimalSchema,
  createBreedingRecordSchema, createPregnancySchema, createBirthRecordSchema,
  createVaccinationSchema, createDiseaseSchema, createTreatmentSchema,
  createFeedingRecordSchema, createWeightRecordSchema,
  createMilkCollectionSchema, createQualityTestSchema, createStorageTankSchema,
  createInventoryCategorySchema, createInventoryItemSchema,
  receiveStockSchema,
  createSupplierSchema, createPurchaseRequestSchema, createPurchaseOrderSchema,
  createVehicleSchema, createDriverSchema, createTransportRequestSchema, createTripSchema,
  createFuelRecordSchema, createMaintenanceSchema,
  createIncomeSchema, createExpenseSchema, createInvoiceSchema,
  createCustomerSchema, createProductSchema, createSalesOrderSchema,
  createHealthRecordSchema, createVaccinationRecordSchema,
  createRoleSchema,
} from '../validators/modules';

import { login, refreshTokenHandler, getProfile, changePassword, logout, updateProfile } from '../controllers/authController';
import { getDashboard, getDepartmentOverview, getHrDashboardHandler, getAnimalDashboardHandler, getMilkDashboardHandler, getStockDashboardHandler, getProcurementDashboardHandler, getLogisticsDashboardHandler, getAccountingDashboardHandler, getSalesDashboardHandler, getVetDashboardHandler } from '../controllers/dashboardController';
import { submitReport, getMyReports, getDepartmentReports, approveReport, rejectReport } from '../controllers/reportController';
import { globalSearch } from '../controllers/searchController';
import { getUsers, getUserById, createUser, updateUser, deleteUser, resetPassword, getManagers } from '../controllers/userController';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { getSystemHealth, createBackup, listBackups, restoreBackup } from '../controllers/systemController';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../controllers/branchController';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { uploadSingle } from '../middlewares/upload';
import { uploadFile } from '../controllers/uploadController';
import { getShiftEmployees, getShifts, getMyShift, createShift, updateShift, deleteShift } from '../controllers/shiftController';

import { getPositions, createPosition, updatePosition, deletePosition } from '../controllers/hr/positionController';
import { getHRReports, getTasks } from '../controllers/hr/reportController';
import { getAttendance, checkIn, checkOut, getAttendanceReport, getTodayAttendance, employeeCheckIn, employeeCheckOut } from '../controllers/hr/attendanceController';
import { addActivity, getMyActivities, getAllActivities } from '../controllers/hr/activityController';
import { getLeaveTypes, createLeaveType, updateLeaveType, getLeaveRequests, createLeaveRequest, approveLeave, rejectLeave, cancelLeave } from '../controllers/hr/leaveController';
import { getContracts, createContract, updateContract, terminateContract, getExpiringContracts } from '../controllers/hr/contractController';
import { getPerformanceReviews, createPerformanceReview, updatePerformanceReview } from '../controllers/hr/performanceController';
import { getTrainings, createTraining, updateTraining, getTrainingParticipants, enrollParticipant, updateParticipantStatus } from '../controllers/hr/trainingController';
import { getJobs, createJob, updateJob, closeJob, getApplicants, createApplicant, updateApplicantStatus } from '../controllers/hr/recruitmentController';

import { getAnimalCategories, createAnimalCategory, updateAnimalCategory, deleteAnimalCategory, getBreeds, createBreed, updateBreed, deleteBreed, getAnimals, getAnimalsForSelect, getAnimalProfile, createAnimal, updateAnimal, deleteAnimal, getAnimalLocations, getAnimalGroups } from '../controllers/animal/animalController';
import { getAnimalReports } from '../controllers/animal/reportController';
import { getCropTypes, createCropType, updateCropType, deleteCropType, getLandAreas, createLandArea, updateLandArea, deleteLandArea, getCropActivities, createCropActivity, updateCropActivity, deleteCropActivity, getCropDashboard, getCropReports } from '../controllers/crop/cropController';
import { getBreedingRecords, createBreedingRecord, updateBreedingRecord, deleteBreedingRecord, getPregnancies, createPregnancy, updatePregnancy, deletePregnancy, getBirthRecords, createBirthRecord, updateBirthRecord, deleteBirthRecord } from '../controllers/animal/breedingController';
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination, getDiseases, createDisease, updateDiseaseStatus, updateDisease, deleteDisease, getTreatments, createTreatment, updateTreatment, deleteTreatment } from '../controllers/animal/healthController';
import { getFeedingRecords, createFeedingRecord, updateFeedingRecord, deleteFeedingRecord, getFeedConsumptionReport } from '../controllers/animal/feedingController';
import { getAnimalTransfers, createAnimalTransfer, updateAnimalTransfer, deleteAnimalTransfer, getAnimalPurchases, createAnimalPurchase, getAnimalSales, createAnimalSale, updateAnimalSale, deleteAnimalSale, getAnimalDeaths, createAnimalDeath, updateAnimalDeath, deleteAnimalDeath, getWeightRecords, createWeightRecord, updateWeightRecord, deleteWeightRecord } from '../controllers/animal/movementController';
import { getTobeInHitRecords, createTobeInHitRecord, updateTobeInHitRecord, deleteTobeInHitRecord, getTobeInHitReports } from '../controllers/animal/tobeInHitController';

import { getMilkCollections, createMilkCollection, updateMilkCollection, deleteMilkCollection, getDailyProduction, getMonthlyProduction } from '../controllers/milk/milkCollectionController';
import { getQualityTests, createQualityTest, deleteQualityTest, updateQualityTest, getQualityAlerts } from '../controllers/milk/milkQualityController';
import { getStorageTanks, createStorageTank, updateStorageTank, getMilkStorage, addMilkToStorage, getStorageReport } from '../controllers/milk/milkStorageController';
import { getProcessingRecords, createProcessingRecord, updateProcessingRecord, deleteProcessingRecord, deleteMilkProduct, getMilkProducts, createMilkProduct, updateMilkProduct } from '../controllers/milk/milkProcessingController';
import { getWasteRecords, createWasteRecord, updateWasteRecord, deleteWasteRecord } from '../controllers/milk/milkWasteController';

import { getInventoryCategories, createInventoryCategory, updateInventoryCategory, deleteInventoryCategory, getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, getLowStockItems, getStockValue } from '../controllers/stock/inventoryController';
import { receiveStock, getStockMovements, getAllStockItems } from '../controllers/stock/stockTransactionController';
import { getFeedItems, createFeedItem, updateFeedItem, deleteFeedItem, getFeedConsumption, recordFeedConsumption, getFeedStockReport } from '../controllers/stock/feedController';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, getExpiringMedicines, getExpiredMedicines } from '../controllers/stock/medicineController';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment, createEquipmentMaintenance } from '../controllers/stock/equipmentController';

import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/sales/customerController';
import { getProductCategories, createProductCategory, updateProductCategory, getProducts, createProduct, updateProduct, deleteProduct, updateProductStock } from '../controllers/sales/productController';
import { getSalesOrders, createSalesOrder, updateSalesOrderStatus, getQuotations, createQuotation, convertQuotationToOrder } from '../controllers/sales/orderController';
import { getSalesInvoices, createSalesInvoice, recordCustomerPayment } from '../controllers/sales/invoiceController';

import { getIncomeRecords, createIncomeRecord, updateIncomeRecord, deleteIncomeRecord, getIncomeSummary } from '../controllers/accounting/incomeController';
import { getExpenseCategories, createExpenseCategory, updateExpenseCategory, getExpenseRecords, createExpenseRecord, updateExpenseRecord, deleteExpenseRecord, getExpenseSummary } from '../controllers/accounting/expenseController';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, recordPayment, getInvoicePDF } from '../controllers/accounting/invoiceController';

import { getBudgets, createBudget, updateBudget, deleteBudget, updateBudgetStatus, getBudgetVsActual } from '../controllers/accounting/budgetController';
import { getPayrollRecords, createPayroll, processPayrollPayment, deletePayrollRecord, getSalaryRecords, createSalaryRecord } from '../controllers/accounting/payrollController';
import { getProfitLoss, getCashFlow, getFinancialSummary } from '../controllers/accounting/reportController';

import { getSupplierCategories, createSupplierCategory, updateSupplierCategory, getSuppliers, createSupplier, updateSupplier, deleteSupplier, rateSupplier } from '../controllers/procurement/supplierController';
import { getProcurementReports } from '../controllers/procurement/reportController';
import { getPurchaseRequests, createPurchaseRequest, updatePurchaseRequest, deletePurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest } from '../controllers/procurement/purchaseRequestController';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus, receivePurchaseOrder, deletePurchaseOrder } from '../controllers/procurement/purchaseOrderController';
import { getProcurementInvoices, createProcurementInvoice, updateProcurementInvoice, deleteProcurementInvoice, payProcurementInvoice } from '../controllers/procurement/invoiceController';
import { getProcurementContracts, createProcurementContract, updateProcurementContract, deleteProcurementContract, getExpiringProcurementContracts } from '../controllers/procurement/contractController';

import { getVehicleTypes, createVehicleType, getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/logistics/vehicleController';
import { getDrivers, createDriver, updateDriver, deleteDriver, getDriverHistory } from '../controllers/logistics/driverController';
import { getTransportRequests, createTransportRequest, approveTransportRequest, rejectTransportRequest, deleteTransportRequest } from '../controllers/logistics/transportController';
import { getTrips, createTrip, updateTrip, deleteTrip, updateTripStatus } from '../controllers/logistics/tripController';
import { getDeliveries, createDelivery, updateDelivery, deleteDelivery, updateDeliveryStatus } from '../controllers/logistics/deliveryController';
import { getFuelRecords, createFuelRecord, updateFuelRecord, deleteFuelRecord } from '../controllers/logistics/fuelController';
import { getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord, getDueMaintenance } from '../controllers/logistics/maintenanceController';
import { getLogisticsReports } from '../controllers/logistics/reportController';

import { getVeterinaryHealth, getVeterinaryHealthById, createVeterinaryHealth, updateVeterinaryHealth, deleteVeterinaryHealth, getVaccinationSchedule, createVaccinationSchedule, getVetVaccinations, createVetVaccination, updateVetVaccination, deleteVetVaccination, getDueVaccinations, getPrescriptions, createPrescription, updatePrescription, deletePrescription } from '../controllers/veterinary/index';
import { getTreatmentPrescriptions, createTreatmentPrescription } from '../controllers/veterinary/healthController';

const router = Router();

// Health
router.get('/health', (req, res) => res.json({ success: true, message: 'OK', data: { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() } }));

// Auth
router.post('/auth/login', validate(loginSchema), login);
router.post('/auth/refresh', validate(refreshTokenSchema), refreshTokenHandler);
router.get('/auth/profile', authenticate, getProfile);
router.put('/auth/profile', authenticate, updateProfile);
router.post('/auth/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/auth/logout', authenticate, logout);

// Settings (admin/owner only)
router.get('/settings', getSettings);
router.put('/settings', authenticate, hasRole('owner', 'admin'), updateSettings);

// File upload
router.post('/upload', authenticate, uploadSingle, uploadFile);

// Shift management (Animal Production Manager and above)
router.get('/shifts/employees', authenticate, hasRole('owner', 'admin', 'animal'), getShiftEmployees);
router.get('/shifts/my-shift', authenticate, getMyShift);
router.get('/shifts', authenticate, hasRole('owner', 'admin', 'animal'), getShifts);
router.post('/shifts', authenticate, hasRole('owner', 'admin', 'animal'), createShift);
router.put('/shifts/:id', authenticate, hasRole('owner', 'admin', 'animal'), updateShift);
router.delete('/shifts/:id', authenticate, hasRole('owner', 'admin', 'animal'), deleteShift);

// Dashboard
router.get('/dashboard', authenticate, getDashboard);
router.get('/dashboard/hr', authenticate, hasRole('owner', 'admin', 'hr'), getHrDashboardHandler);
router.get('/dashboard/animals', authenticate, hasRole('owner', 'admin', 'animal', 'veterinarian'), getAnimalDashboardHandler);
router.get('/dashboard/animal', authenticate, hasRole('owner', 'admin', 'animal', 'veterinarian'), getAnimalDashboardHandler);
router.get('/dashboard/milk', authenticate, hasRole('owner', 'admin', 'milk'), getMilkDashboardHandler);
router.get('/dashboard/stock', authenticate, hasRole('owner', 'admin', 'stock'), getStockDashboardHandler);
router.get('/dashboard/procurement', authenticate, hasRole('owner', 'admin', 'procurement'), getProcurementDashboardHandler);
router.get('/dashboard/logistics', authenticate, hasRole('owner', 'admin', 'logistics'), getLogisticsDashboardHandler);
router.get('/dashboard/accounting', authenticate, hasRole('owner', 'admin', 'accountant'), getAccountingDashboardHandler);
router.get('/dashboard/accountant', authenticate, hasRole('owner', 'admin', 'accountant'), getAccountingDashboardHandler);
router.get('/dashboard/sales', authenticate, hasRole('owner', 'admin', 'sales'), getSalesDashboardHandler);
router.get('/dashboard/veterinary', authenticate, hasRole('owner', 'admin', 'veterinarian'), getVetDashboardHandler);
router.get('/dashboard/veterinarian', authenticate, hasRole('owner', 'admin', 'veterinarian'), getVetDashboardHandler);
router.get('/dashboard/overview', authenticate, getDepartmentOverview);
router.get('/dashboard/latest-employees', authenticate, hasRole('owner', 'admin'), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [rows] = await pool.query(`
      SELECT e.id, u.first_name, u.last_name, d.name as department_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE e.deleted_at IS NULL AND e.status = 'active'
      ORDER BY e.created_at DESC LIMIT 5
    `);
    const { success } = await import('../utils/response');
    return success(res, rows);
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});

router.get('/dashboard/latest-animals', authenticate, async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.name, a.tag_number as tag_id,
             b.name as breed_name, c.name as category_name
      FROM animals a
      LEFT JOIN breeds b ON a.breed_id = b.id
      LEFT JOIN animal_categories c ON a.animal_category_id = c.id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC LIMIT 5
    `);
    const { success } = await import('../utils/response');
    return success(res, rows);
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});

// Reports / Daily Reports
router.post('/reports', authenticate, submitReport);
router.get('/reports/my', authenticate, getMyReports);
router.get('/reports/department', authenticate, hasRole('owner', 'admin', 'hr', 'animal', 'milk', 'stock', 'procurement', 'logistics', 'accountant', 'sales', 'veterinarian'), getDepartmentReports);
router.put('/reports/:id/approve', authenticate, approveReport);
router.put('/reports/:id/reject', authenticate, rejectReport);

// Search
router.get('/search', authenticate, globalSearch);

// Users
router.get('/users', authenticate, authorize(['users.view']), getUsers);
router.get('/users/managers', authenticate, hasRole('owner', 'admin', 'hr'), getManagers);
router.get('/users/:id', authenticate, authorize(['users.view']), getUserById);
router.post('/users', authenticate, authorize(['users.create']), validate(createUserSchema), createUser);
router.put('/users/:id', authenticate, authorize(['users.update']), validate(updateUserSchema), updateUser);
router.delete('/users/:id', authenticate, authorize(['users.delete']), deleteUser);
router.put('/users/reset-password/:id', authenticate, authorize(['users.update']), resetPassword);

// Roles
router.get('/roles', authenticate, authorize(['roles.view']), getRoles);
router.post('/roles', authenticate, authorize(['roles.create']), validate(createRoleSchema), createRole);
router.put('/roles/:id', authenticate, authorize(['roles.update']), validate(createRoleSchema), updateRole);
router.delete('/roles/:id', authenticate, authorize(['roles.delete']), deleteRole);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markAsRead);
router.put('/notifications/read-all', authenticate, markAllAsRead);

// System
router.get('/system/health', authenticate, getSystemHealth);
router.post('/system/backup', authenticate, hasRole('owner', 'admin'), createBackup);
router.get('/system/backups', authenticate, hasRole('owner', 'admin'), listBackups);
router.post('/system/backups/restore', authenticate, hasRole('owner', 'admin'), restoreBackup);

// Branches
router.get('/branches', authenticate, getBranches);
router.post('/branches', authenticate, hasRole('owner', 'admin'), createBranch);
router.put('/branches/:id', authenticate, hasRole('owner', 'admin'), updateBranch);
router.delete('/branches/:id', authenticate, hasRole('owner', 'admin'), deleteBranch);

// Departments & Positions (lookup endpoints used by EmployeesPage)
router.get('/departments', authenticate, getDepartments);
router.post('/departments', authenticate, authorize(['employees.create']), createDepartment);
router.put('/departments/:id', authenticate, authorize(['employees.update']), updateDepartment);
router.delete('/departments/:id', authenticate, authorize(['employees.delete']), deleteDepartment);
router.get('/positions', authenticate, authorize(['employees.view']), getPositions);

// HR - Positions
router.get('/hr/positions', authenticate, authorize(['employees.view']), getPositions);
router.post('/hr/positions', authenticate, authorize(['employees.create']), validate(createPositionSchema), createPosition);
router.put('/hr/positions/:id', authenticate, authorize(['employees.update']), validate(createPositionSchema), updatePosition);
router.delete('/hr/positions/:id', authenticate, authorize(['employees.delete']), deletePosition);

// HR - Attendance
router.get('/hr/attendance', authenticate, authorize(['attendance.view']), getAttendance);
router.post('/hr/attendance/check-in', authenticate, authorize(['attendance.create']), validate(createAttendanceSchema), checkIn);
router.put('/hr/attendance/:id/check-out', authenticate, authorize(['attendance.update']), checkOut);
router.get('/hr/attendance/report', authenticate, authorize(['attendance.view']), getAttendanceReport);

// HR - Leave
router.get('/hr/leave-types', authenticate, authorize(['leave.view']), getLeaveTypes);
router.post('/hr/leave-types', authenticate, authorize(['leave.create']), validate(createLeaveTypeSchema), createLeaveType);
router.put('/hr/leave-types/:id', authenticate, authorize(['leave.update']), updateLeaveType);
router.get('/hr/leave-requests', authenticate, authorize(['leave.view']), getLeaveRequests);
router.post('/hr/leave-requests', authenticate, authorize(['leave.create']), validate(createLeaveRequestSchema), createLeaveRequest);
router.put('/hr/leave-requests/:id/approve', authenticate, authorize(['leave.approve']), approveLeave);
router.put('/hr/leave-requests/:id/reject', authenticate, authorize(['leave.approve']), rejectLeave);
router.put('/hr/leave-requests/:id/cancel', authenticate, authorize(['leave.update']), cancelLeave);

// HR - Contracts
router.get('/hr/contracts', authenticate, authorize(['contracts.view']), getContracts);
router.post('/hr/contracts', authenticate, authorize(['contracts.create']), validate(createContractSchema), createContract);
router.put('/hr/contracts/:id', authenticate, authorize(['contracts.update']), validate(updateContractSchema), updateContract);
router.put('/hr/contracts/:id/terminate', authenticate, authorize(['contracts.update']), terminateContract);
router.get('/hr/contracts/expiring', authenticate, authorize(['contracts.view']), getExpiringContracts);

// HR - Performance
router.get('/hr/performance-reviews', authenticate, authorize(['performance.view']), getPerformanceReviews);
router.post('/hr/performance-reviews', authenticate, authorize(['performance.create']), validate(createPerformanceReviewSchema), createPerformanceReview);
router.put('/hr/performance-reviews/:id', authenticate, authorize(['performance.update']), validate(createPerformanceReviewSchema), updatePerformanceReview);

// HR - Training
router.get('/hr/trainings', authenticate, authorize(['training.view']), getTrainings);
router.post('/hr/trainings', authenticate, authorize(['training.create']), validate(createTrainingSchema), createTraining);
router.put('/hr/trainings/:id', authenticate, authorize(['training.update']), updateTraining);
router.get('/hr/trainings/:id/participants', authenticate, authorize(['training.view']), getTrainingParticipants);
router.post('/hr/trainings/:id/enroll', authenticate, authorize(['training.create']), enrollParticipant);
router.put('/hr/training-participants/:id', authenticate, authorize(['training.update']), updateParticipantStatus);

// HR - Recruitment
router.get('/hr/recruitment/jobs', authenticate, authorize(['recruitment.view']), getJobs);
router.post('/hr/recruitment/jobs', authenticate, authorize(['recruitment.create']), validate(createJobSchema), createJob);
router.put('/hr/recruitment/jobs/:id', authenticate, authorize(['recruitment.update']), updateJob);
router.put('/hr/recruitment/jobs/:id/close', authenticate, authorize(['recruitment.update']), closeJob);
router.get('/hr/recruitment/applicants', authenticate, authorize(['recruitment.view']), getApplicants);
router.post('/hr/recruitment/applicants', authenticate, authorize(['recruitment.create']), validate(createApplicantSchema), createApplicant);
router.put('/hr/recruitment/applicants/:id/status', authenticate, authorize(['recruitment.update']), updateApplicantStatus);

// HR - Reports
router.get('/hr/reports', authenticate, hasRole('owner', 'admin', 'hr'), getHRReports);
router.get('/tasks', authenticate, hasRole('owner', 'admin', 'hr'), getTasks);

// ─────────────────────────────────────────────
// Frontend Route Aliases (without /hr/ prefix)
// These mirror the /hr/ routes for frontend compatibility
// ─────────────────────────────────────────────

// Positions CRUD aliases
router.post('/positions', authenticate, authorize(['employees.create']), validate(createPositionSchema), createPosition);
router.put('/positions/:id', authenticate, authorize(['employees.update']), validate(createPositionSchema), updatePosition);
router.delete('/positions/:id', authenticate, authorize(['employees.delete']), deletePosition);

// Attendance aliases
router.get('/attendance', authenticate, authorize(['attendance.view']), getAttendance);
router.post('/attendance/check-in', authenticate, authorize(['attendance.create']), validate(createAttendanceSchema), checkIn);
router.put('/attendance/:id/check-out', authenticate, authorize(['attendance.update']), checkOut);
// Frontend sends POST /attendance/check-out with { user_id } - find today's attendance and check out
router.post('/attendance/check-out', authenticate, authorize(['attendance.update']), async (req, res, next) => {
  const { default: pool } = await import('../config/database');
  if (req.body.user_id) {
    const [rows]: any = await pool.query('SELECT id FROM attendance WHERE user_id = ? AND date = CURDATE() AND check_out IS NULL LIMIT 1', [req.body.user_id]);
    if (rows.length > 0) req.params.id = rows[0].id;
  }
  next();
}, checkOut);
router.get('/attendance/report', authenticate, authorize(['attendance.view']), getAttendanceReport);

// Employee-facing attendance (worker can check in/out)
router.get('/attendance/today', authenticate, getTodayAttendance);
router.post('/attendance/checkin', authenticate, employeeCheckIn);
router.post('/attendance/checkout', authenticate, employeeCheckOut);

// Employee daily activities
router.post('/activities', authenticate, addActivity);
router.get('/activities/my', authenticate, getMyActivities);
router.get('/activities', authenticate, authorize(['attendance.view']), getAllActivities);

// User profile for employee dashboard
router.get('/users/me', authenticate, async (req: any, res) => {
  const { default: pool } = await import('../config/database');
  const [rows]: any = await pool.query(
    'SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.photo, r.slug as role, d.name as department_name, e.position, e.employee_code FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN departments d ON u.department_id = d.id LEFT JOIN employees e ON e.user_id = u.id WHERE u.id = ?',
    [req.user!.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ data: rows[0] });
});

// Leave aliases
router.get('/leave-types', authenticate, authorize(['leave.view']), getLeaveTypes);
router.post('/leave-types', authenticate, authorize(['leave.create']), validate(createLeaveTypeSchema), createLeaveType);
router.put('/leave-types/:id', authenticate, authorize(['leave.update']), updateLeaveType);
router.get('/leave-requests', authenticate, authorize(['leave.view']), getLeaveRequests);
router.post('/leave-requests', authenticate, authorize(['leave.create']), validate(createLeaveRequestSchema), createLeaveRequest);
router.put('/leave-requests/:id/approve', authenticate, authorize(['leave.approve']), approveLeave);
router.put('/leave-requests/:id/reject', authenticate, authorize(['leave.approve']), rejectLeave);
router.put('/leave-requests/:id/cancel', authenticate, authorize(['leave.update']), cancelLeave);

// Contracts aliases
router.get('/contracts', authenticate, authorize(['contracts.view']), getContracts);
router.post('/contracts', authenticate, authorize(['contracts.create']), validate(createContractSchema), createContract);
router.put('/contracts/:id', authenticate, authorize(['contracts.update']), validate(updateContractSchema), updateContract);
router.put('/contracts/:id/terminate', authenticate, authorize(['contracts.update']), terminateContract);
router.get('/contracts/expiring', authenticate, authorize(['contracts.view']), getExpiringContracts);

// Performance aliases
router.get('/performance-reviews', authenticate, authorize(['performance.view']), getPerformanceReviews);
router.post('/performance-reviews', authenticate, authorize(['performance.create']), validate(createPerformanceReviewSchema), createPerformanceReview);
router.put('/performance-reviews/:id', authenticate, authorize(['performance.update']), validate(createPerformanceReviewSchema), updatePerformanceReview);

// Training aliases (frontend uses singular /training, backend uses /hr/trainings)
router.get('/training', authenticate, authorize(['training.view']), getTrainings);
router.post('/training', authenticate, authorize(['training.create']), validate(createTrainingSchema), createTraining);
router.put('/training/:id', authenticate, authorize(['training.update']), updateTraining);
router.get('/training/:trainingId/participants', authenticate, authorize(['training.view']), (req, res, next) => { req.params.id = req.params.trainingId; next(); }, getTrainingParticipants);
router.post('/training/:trainingId/enroll', authenticate, authorize(['training.create']), enrollParticipant);
router.put('/training/:trainingId/participants/:participantId', authenticate, authorize(['training.update']), (req, res, next) => { req.params.id = req.params.participantId; next(); }, updateParticipantStatus);

// Recruitment aliases
router.get('/recruitment/jobs', authenticate, authorize(['recruitment.view']), getJobs);
router.post('/recruitment/jobs', authenticate, authorize(['recruitment.create']), validate(createJobSchema), createJob);
router.put('/recruitment/jobs/:id', authenticate, authorize(['recruitment.update']), updateJob);
router.put('/recruitment/jobs/:id/close', authenticate, authorize(['recruitment.update']), closeJob);
router.get('/recruitment/applicants', authenticate, authorize(['recruitment.view']), getApplicants);
router.post('/recruitment/applicants', authenticate, authorize(['recruitment.create']), validate(createApplicantSchema), createApplicant);
router.put('/recruitment/applicants/:id/status', authenticate, authorize(['recruitment.update']), updateApplicantStatus);

// Animal - Locations & Groups
router.get('/animals/locations', authenticate, authorize(['animals.view']), getAnimalLocations);
router.get('/animals/groups', authenticate, authorize(['animals.view']), getAnimalGroups);

// Animal - Categories
router.get('/animals/categories', authenticate, authorize(['animals.view']), getAnimalCategories);
router.post('/animals/categories', authenticate, authorize(['animals.create']), validate(createAnimalCategorySchema), createAnimalCategory);
router.put('/animals/categories/:id', authenticate, authorize(['animals.update']), updateAnimalCategory);
router.delete('/animals/categories/:id', authenticate, authorize(['animals.delete']), deleteAnimalCategory);

// Animal - Breeds
router.get('/animals/breeds', authenticate, authorize(['animals.view']), getBreeds);
  router.post('/animals/breeds', authenticate, authorize(['animals.create']), createBreed);
  router.put('/animals/breeds/:id', authenticate, authorize(['animals.update']), updateBreed);
  router.delete('/animals/breeds/:id', authenticate, authorize(['animals.delete']), deleteBreed);

// Animal - Breeding (must be before :id routes)
router.get('/animals/breeding', authenticate, authorize(['breeding.view']), getBreedingRecords);
router.post('/animals/breeding', authenticate, authorize(['breeding.create']), validate(createBreedingRecordSchema), createBreedingRecord);
router.put('/animals/breeding/:id', authenticate, authorize(['breeding.update']), updateBreedingRecord);
router.delete('/animals/breeding/:id', authenticate, authorize(['breeding.delete']), deleteBreedingRecord);
router.get('/animals/pregnancies', authenticate, authorize(['breeding.view']), getPregnancies);
router.post('/animals/pregnancies', authenticate, authorize(['breeding.create']), validate(createPregnancySchema), createPregnancy);
router.put('/animals/pregnancies/:id', authenticate, authorize(['breeding.update']), updatePregnancy);
router.delete('/animals/pregnancies/:id', authenticate, authorize(['breeding.delete']), deletePregnancy);
router.get('/animals/births', authenticate, authorize(['breeding.view']), getBirthRecords);
router.post('/animals/births', authenticate, authorize(['breeding.create']), validate(createBirthRecordSchema), createBirthRecord);
router.put('/animals/births/:id', authenticate, authorize(['breeding.update']), updateBirthRecord);
router.delete('/animals/births/:id', authenticate, authorize(['breeding.delete']), deleteBirthRecord);

// Animal - Vaccinations
router.get('/animals/vaccinations', authenticate, authorize(['vaccination.view']), getVaccinations);
router.post('/animals/vaccinations', authenticate, authorize(['vaccination.create']), validate(createVaccinationSchema), createVaccination);
router.put('/animals/vaccinations/:id', authenticate, authorize(['vaccination.update']), updateVaccination);
router.delete('/animals/vaccinations/:id', authenticate, authorize(['vaccination.delete']), deleteVaccination);

// Animal - Diseases
router.get('/animals/diseases', authenticate, authorize(['health.view']), getDiseases);
router.post('/animals/diseases', authenticate, authorize(['health.create']), validate(createDiseaseSchema), createDisease);
router.put('/animals/diseases/:id/status', authenticate, authorize(['health.update']), updateDiseaseStatus);
router.put('/animals/diseases/:id', authenticate, authorize(['health.update']), updateDisease);
router.delete('/animals/diseases/:id', authenticate, authorize(['health.delete']), deleteDisease);

// Animal - Treatments
router.get('/animals/treatments', authenticate, authorize(['health.view']), getTreatments);
router.post('/animals/treatments', authenticate, authorize(['health.create']), validate(createTreatmentSchema), createTreatment);
router.put('/animals/treatments/:id', authenticate, authorize(['health.update']), updateTreatment);
router.delete('/animals/treatments/:id', authenticate, authorize(['health.delete']), deleteTreatment);

// Animal - Transfers
router.get('/animals/transfers', authenticate, authorize(['animals.view']), getAnimalTransfers);
router.post('/animals/transfers', authenticate, authorize(['animals.create']), createAnimalTransfer);
router.put('/animals/transfers/:id', authenticate, authorize(['animals.update']), updateAnimalTransfer);
router.delete('/animals/transfers/:id', authenticate, authorize(['animals.delete']), deleteAnimalTransfer);

// Animal - Purchases
router.get('/animals/purchases', authenticate, authorize(['animals.view']), getAnimalPurchases);
router.post('/animals/purchases', authenticate, authorize(['animals.create']), createAnimalPurchase);

// Animal - Sales
router.get('/animals/sales', authenticate, authorize(['animals.view']), getAnimalSales);
router.post('/animals/sales', authenticate, authorize(['animals.create']), createAnimalSale);
router.put('/animals/sales/:id', authenticate, authorize(['animals.update']), updateAnimalSale);
router.delete('/animals/sales/:id', authenticate, authorize(['animals.delete']), deleteAnimalSale);

// Animal - Deaths
router.get('/animals/deaths', authenticate, authorize(['animals.view']), getAnimalDeaths);
router.post('/animals/deaths', authenticate, authorize(['animals.create']), createAnimalDeath);
router.put('/animals/deaths/:id', authenticate, authorize(['animals.update']), updateAnimalDeath);
router.delete('/animals/deaths/:id', authenticate, authorize(['animals.delete']), deleteAnimalDeath);

// Animal - Weights
router.get('/animals/weights', authenticate, authorize(['weight.view']), getWeightRecords);
router.post('/animals/weights', authenticate, authorize(['weight.create']), validate(createWeightRecordSchema), createWeightRecord);
router.put('/animals/weights/:id', authenticate, authorize(['weight.update']), updateWeightRecord);
router.delete('/animals/weights/:id', authenticate, authorize(['weight.delete']), deleteWeightRecord);

// Animal - Feeding
router.get('/animals/feeding', authenticate, authorize(['feeding.view']), getFeedingRecords);
router.post('/animals/feeding', authenticate, authorize(['feeding.create']), validate(createFeedingRecordSchema), createFeedingRecord);
router.put('/animals/feeding/:id', authenticate, authorize(['feeding.update']), updateFeedingRecord);
router.delete('/animals/feeding/:id', authenticate, authorize(['feeding.delete']), deleteFeedingRecord);
router.get('/animals/feeding/report', authenticate, authorize(['feeding.view']), getFeedConsumptionReport);

// Animal - Dashboard (must be before :id catch-all)
router.get('/animals/dashboard', authenticate, hasRole('owner', 'admin', 'animal', 'veterinarian'), getDashboard);
// Animal - Main (keep :id routes AFTER all named routes)
router.get('/animals/reports', authenticate, authorize(['animals.view']), getAnimalReports);
router.get('/animals/select', authenticate, hasRole('owner', 'admin', 'animal', 'veterinarian'), getAnimalsForSelect);
router.get('/animals', authenticate, authorize(['animals.view']), getAnimals);
router.post('/animals', authenticate, authorize(['animals.create']), validate(createAnimalSchema), createAnimal);
router.get('/animals/:id', authenticate, authorize(['animals.view']), getAnimalProfile);
router.put('/animals/:id', authenticate, authorize(['animals.update']), validate(updateAnimalSchema), updateAnimal);
router.delete('/animals/:id', authenticate, authorize(['animals.delete']), deleteAnimal);

// ─────────────────────────────────────────────
// Animal Frontend Route Aliases (for legacy frontend URLs)
  // --- Crop Production routes ---
  router.get('/crops/dashboard', authenticate, authorize(['crops.view']), getCropDashboard);
  router.get('/crops/reports', authenticate, authorize(['crops.view']), getCropReports);
  router.get('/crops/types', authenticate, authorize(['crops.view']), getCropTypes);
  router.post('/crops/types', authenticate, authorize(['crops.create']), createCropType);
  router.put('/crops/types/:id', authenticate, authorize(['crops.update']), updateCropType);
  router.delete('/crops/types/:id', authenticate, authorize(['crops.delete']), deleteCropType);
  router.get('/crops/land', authenticate, authorize(['crops.view']), getLandAreas);
  router.post('/crops/land', authenticate, authorize(['crops.create']), createLandArea);
  router.put('/crops/land/:id', authenticate, authorize(['crops.update']), updateLandArea);
  router.delete('/crops/land/:id', authenticate, authorize(['crops.delete']), deleteLandArea);
  router.get('/crops/activities', authenticate, authorize(['crops.view']), getCropActivities);
  router.post('/crops/activities', authenticate, authorize(['crops.create']), createCropActivity);
  router.put('/crops/activities/:id', authenticate, authorize(['crops.update']), updateCropActivity);
  router.delete('/crops/activities/:id', authenticate, authorize(['crops.delete']), deleteCropActivity);

  // Frontend uses /breeding, /health, /movement, /feeding - backend uses /animals/...
// ─────────────────────────────────────────────
// Breeding aliases
router.get('/breeding', authenticate, authorize(['breeding.view']), getBreedingRecords);
router.post('/breeding', authenticate, authorize(['breeding.create']), validate(createBreedingRecordSchema), createBreedingRecord);
router.get('/breeding/pregnancies', authenticate, authorize(['breeding.view']), getPregnancies);
router.post('/breeding/pregnancies', authenticate, authorize(['breeding.create']), validate(createPregnancySchema), createPregnancy);
router.put('/breeding/pregnancies/:id', authenticate, authorize(['breeding.update']), updatePregnancy);
router.delete('/breeding/pregnancies/:id', authenticate, authorize(['breeding.delete']), deletePregnancy);
router.get('/breeding/births', authenticate, authorize(['breeding.view']), getBirthRecords);
router.post('/breeding/births', authenticate, authorize(['breeding.create']), validate(createBirthRecordSchema), createBirthRecord);
router.put('/breeding/births/:id', authenticate, authorize(['breeding.update']), updateBirthRecord);
router.delete('/breeding/births/:id', authenticate, authorize(['breeding.delete']), deleteBirthRecord);
router.put('/breeding/:id', authenticate, authorize(['breeding.update']), updateBreedingRecord);
router.delete('/breeding/:id', authenticate, authorize(['breeding.delete']), deleteBreedingRecord);

// Health aliases (frontend uses /health/...)
router.get('/health/vaccinations', authenticate, authorize(['vaccination.view']), getVaccinations);
router.post('/health/vaccinations', authenticate, authorize(['vaccination.create']), validate(createVaccinationSchema), createVaccination);
router.put('/health/vaccinations/:id', authenticate, authorize(['vaccination.update']), updateVaccination);
router.delete('/health/vaccinations/:id', authenticate, authorize(['vaccination.delete']), deleteVaccination);
router.get('/health/diseases', authenticate, authorize(['health.view']), getDiseases);
router.post('/health/diseases', authenticate, authorize(['health.create']), validate(createDiseaseSchema), createDisease);
router.put('/health/diseases/:id/status', authenticate, authorize(['health.update']), updateDiseaseStatus);
router.put('/health/diseases/:id', authenticate, authorize(['health.update']), updateDisease);
router.delete('/health/diseases/:id', authenticate, authorize(['health.delete']), deleteDisease);
router.get('/health/treatments', authenticate, authorize(['health.view']), getTreatments);
router.post('/health/treatments', authenticate, authorize(['health.create']), validate(createTreatmentSchema), createTreatment);
router.put('/health/treatments/:id', authenticate, authorize(['health.update']), updateTreatment);
router.delete('/health/treatments/:id', authenticate, authorize(['health.delete']), deleteTreatment);

// Movement aliases (frontend uses /movement/...)
router.get('/movement/transfers', authenticate, authorize(['animals.view']), getAnimalTransfers);
router.post('/movement/transfers', authenticate, authorize(['animals.create']), createAnimalTransfer);
router.put('/movement/transfers/:id', authenticate, authorize(['animals.update']), updateAnimalTransfer);
router.delete('/movement/transfers/:id', authenticate, authorize(['animals.delete']), deleteAnimalTransfer);
router.get('/movement/purchases', authenticate, authorize(['animals.view']), getAnimalPurchases);
router.post('/movement/purchases', authenticate, authorize(['animals.create']), createAnimalPurchase);
router.get('/movement/sales', authenticate, authorize(['animals.view']), getAnimalSales);
router.post('/movement/sales', authenticate, authorize(['animals.create']), createAnimalSale);
router.put('/movement/sales/:id', authenticate, authorize(['animals.update']), updateAnimalSale);
router.delete('/movement/sales/:id', authenticate, authorize(['animals.delete']), deleteAnimalSale);
router.get('/movement/deaths', authenticate, authorize(['animals.view']), getAnimalDeaths);
router.post('/movement/deaths', authenticate, authorize(['animals.create']), createAnimalDeath);
router.put('/movement/deaths/:id', authenticate, authorize(['animals.update']), updateAnimalDeath);
router.delete('/movement/deaths/:id', authenticate, authorize(['animals.delete']), deleteAnimalDeath);
router.get('/movement/weights', authenticate, authorize(['weight.view']), getWeightRecords);
router.post('/movement/weights', authenticate, authorize(['weight.create']), validate(createWeightRecordSchema), createWeightRecord);
router.put('/movement/weights/:id', authenticate, authorize(['weight.update']), updateWeightRecord);
router.delete('/movement/weights/:id', authenticate, authorize(['weight.delete']), deleteWeightRecord);

// ─────────────────────────────────────────────
// Tobe in hit routes
router.get('/animal/tobe-in-hit/reports', authenticate, hasRole('owner', 'admin', 'animal'), getTobeInHitReports);
router.get('/animal/tobe-in-hit', authenticate, hasRole('owner', 'admin', 'animal'), getTobeInHitRecords);
router.post('/animal/tobe-in-hit', authenticate, hasRole('owner', 'admin', 'animal'), createTobeInHitRecord);
router.put('/animal/tobe-in-hit/:id', authenticate, hasRole('owner', 'admin', 'animal'), updateTobeInHitRecord);
router.delete('/animal/tobe-in-hit/:id', authenticate, hasRole('owner', 'admin', 'animal'), deleteTobeInHitRecord);

// Feeding aliases (frontend uses /feeding/...)
router.get('/feeding', authenticate, authorize(['feeding.view']), getFeedingRecords);
router.post('/feeding', authenticate, authorize(['feeding.create']), validate(createFeedingRecordSchema), createFeedingRecord);
router.put('/feeding/:id', authenticate, authorize(['feeding.update']), updateFeedingRecord);
router.delete('/feeding/:id', authenticate, authorize(['feeding.delete']), deleteFeedingRecord);
router.get('/feeding/report', authenticate, authorize(['feeding.view']), getFeedConsumptionReport);

// Milk - Collections
router.get('/milk/collections', authenticate, authorize(['milk_collection.view']), getMilkCollections);
router.post('/milk/collections', authenticate, authorize(['milk_collection.create']), validate(createMilkCollectionSchema), createMilkCollection);
router.put('/milk/collections/:id', authenticate, authorize(['milk_collection.update']), validate(createMilkCollectionSchema), updateMilkCollection);
router.delete('/milk/collections/:id', authenticate, authorize(['milk_collection.delete']), deleteMilkCollection);
router.get('/milk/daily-production', authenticate, authorize(['milk_collection.view']), getDailyProduction);
router.get('/milk/monthly-production', authenticate, authorize(['milk_collection.view']), getMonthlyProduction);

// Milk - Quality
router.get('/milk/quality', authenticate, authorize(['milk_quality.view']), getQualityTests);
router.post('/milk/quality', authenticate, authorize(['milk_quality.create']), validate(createQualityTestSchema), createQualityTest);
router.put('/milk/quality/:id', authenticate, authorize(['milk_quality.update']), updateQualityTest);
router.delete('/milk/quality/:id', authenticate, authorize(['milk_quality.delete']), deleteQualityTest);
router.get('/milk/quality/alerts', authenticate, authorize(['milk_quality.view']), getQualityAlerts);

// Milk - Storage
router.get('/milk/tanks', authenticate, authorize(['milk_storage.view']), getStorageTanks);
router.post('/milk/tanks', authenticate, authorize(['milk_storage.create']), validate(createStorageTankSchema), createStorageTank);
router.put('/milk/tanks/:id', authenticate, authorize(['milk_storage.update']), updateStorageTank);
router.get('/milk/storage', authenticate, authorize(['milk_storage.view']), getMilkStorage);
router.post('/milk/storage/add', authenticate, authorize(['milk_storage.create']), addMilkToStorage);
router.get('/milk/storage/report', authenticate, authorize(['milk_storage.view']), getStorageReport);

// Milk - Processing
router.get('/milk/processing', authenticate, authorize(['milk_processing.view']), getProcessingRecords);
router.post('/milk/processing', authenticate, authorize(['milk_processing.create']), createProcessingRecord);
router.get('/milk/products', authenticate, authorize(['milk_processing.view']), getMilkProducts);
router.post('/milk/products', authenticate, authorize(['milk_processing.create']), createMilkProduct);
router.put('/milk/products/:id', authenticate, authorize(['milk_processing.update']), updateMilkProduct);

// Milk - Processing
router.put('/milk/processing/:id', authenticate, authorize(['milk_processing.update']), updateProcessingRecord);
router.delete('/milk/processing/:id', authenticate, authorize(['milk_processing.delete']), deleteProcessingRecord);
router.delete('/milk/products/:id', authenticate, authorize(['milk_processing.delete']), deleteMilkProduct);

// Milk - Waste
router.get('/milk/waste', authenticate, authorize(['milk.view']), getWasteRecords);
router.post('/milk/waste', authenticate, authorize(['milk.create']), createWasteRecord);
router.put('/milk/waste/:id', authenticate, authorize(['milk.update']), updateWasteRecord);
router.delete('/milk/waste/:id', authenticate, authorize(['milk.delete']), deleteWasteRecord);

router.get('/milk/reports', authenticate, async (req, res) => {
  const pool = (await import('../config/database')).default;
  const start_date = (req.query.start_date as string) || new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
  const end_date = (req.query.end_date as string) || new Date().toISOString().split('T')[0];
  try {
    const [daily] = await pool.query(
      `SELECT collection_date as date,
              SUM(CASE WHEN time='morning' THEN quantity_liters ELSE 0 END) as morning,
              SUM(CASE WHEN time='evening' THEN quantity_liters ELSE 0 END) as evening,
              SUM(quantity_liters) as total,
              SUM(number_of_animals) as number_of_animals
       FROM milk_collections
       WHERE collection_date BETWEEN ? AND ? AND deleted_at IS NULL
       GROUP BY collection_date ORDER BY collection_date`,
      [start_date, end_date]
    );
    const [quality] = await pool.query(
      `SELECT * FROM milk_quality_tests WHERE test_date BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY test_date`,
      [start_date, end_date]
    );
    const [waste] = await pool.query(
      `SELECT * FROM milk_waste WHERE date BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY date`,
      [start_date, end_date]
    );
    const { success } = await import('../utils/response');
    return success(res, { daily, quality, waste });
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});

// Stock - All Items (unified from feed, medicine, equipment, inventory)
router.get('/stock/all-items', authenticate, authorize(['inventory.view']), getAllStockItems);

// Stock - Categories
router.get('/stock/categories', authenticate, authorize(['inventory.view']), getInventoryCategories);
router.post('/stock/categories', authenticate, authorize(['inventory.create']), validate(createInventoryCategorySchema), createInventoryCategory);
router.put('/stock/categories/:id', authenticate, authorize(['inventory.update']), updateInventoryCategory);
router.delete('/stock/categories/:id', authenticate, authorize(['inventory.delete']), deleteInventoryCategory);

// Stock - Items
router.get('/stock/items', authenticate, authorize(['inventory.view']), getInventoryItems);
router.post('/stock/items', authenticate, authorize(['inventory.create']), validate(createInventoryItemSchema), createInventoryItem);
router.put('/stock/items/:id', authenticate, authorize(['inventory.update']), updateInventoryItem);
router.delete('/stock/items/:id', authenticate, authorize(['inventory.delete']), deleteInventoryItem);
router.get('/stock/items/low-stock', authenticate, authorize(['inventory.view']), getLowStockItems);
router.get('/stock/items/value', authenticate, authorize(['inventory.view']), getStockValue);

// Stock - Transactions
router.get('/stock/transactions', authenticate, authorize(['stock.view']), getStockMovements);
router.post('/stock/receive', authenticate, authorize(['stock.create']), validate(receiveStockSchema), receiveStock);

// Stock - Feed
router.get('/stock/feed', authenticate, authorize(['feed.view']), getFeedItems);
router.post('/stock/feed', authenticate, authorize(['feed.create']), createFeedItem);
  router.put('/stock/feed/:id', authenticate, authorize(['feed.update']), updateFeedItem);
  router.delete('/stock/feed/:id', authenticate, authorize(['feed.delete']), deleteFeedItem);
router.get('/stock/feed/consumption', authenticate, authorize(['feed.view']), getFeedConsumption);
router.post('/stock/feed/consumption', authenticate, authorize(['feed.create']), recordFeedConsumption);
router.get('/stock/feed/report', authenticate, authorize(['feed.view']), getFeedStockReport);

// Stock - Medicines
router.get('/stock/medicines', authenticate, authorize(['medicine.view']), getMedicines);
router.post('/stock/medicines', authenticate, authorize(['medicine.create']), createMedicine);
router.put('/stock/medicines/:id', authenticate, authorize(['medicine.update']), updateMedicine);
router.get('/stock/medicines/expiring', authenticate, authorize(['medicine.view']), getExpiringMedicines);
router.get('/stock/medicines/expired', authenticate, authorize(['medicine.view']), getExpiredMedicines);
router.delete('/stock/medicines/:id', authenticate, authorize(['medicine.delete']), deleteMedicine);

// Stock - Equipment
router.get('/stock/equipment', authenticate, authorize(['equipment.view']), getEquipment);
router.post('/stock/equipment', authenticate, authorize(['equipment.create']), createEquipment);
router.put('/stock/equipment/:id', authenticate, authorize(['equipment.update']), updateEquipment);
router.delete('/stock/equipment/:id', authenticate, authorize(['equipment.delete']), deleteEquipment);
router.post('/stock/equipment/:id/maintenance', authenticate, authorize(['equipment.update']), createEquipmentMaintenance);

// Procurement - Supplier Categories
router.get('/procurement/supplier-categories', authenticate, authorize(['suppliers.view']), getSupplierCategories);
router.post('/procurement/supplier-categories', authenticate, authorize(['suppliers.create']), createSupplierCategory);
router.put('/procurement/supplier-categories/:id', authenticate, authorize(['suppliers.update']), updateSupplierCategory);

// Procurement - Suppliers
router.get('/procurement/suppliers', authenticate, authorize(['suppliers.view']), getSuppliers);
router.post('/procurement/suppliers', authenticate, authorize(['suppliers.create']), validate(createSupplierSchema), createSupplier);
router.put('/procurement/suppliers/:id', authenticate, authorize(['suppliers.update']), updateSupplier);
router.delete('/procurement/suppliers/:id', authenticate, authorize(['suppliers.delete']), deleteSupplier);
router.post('/procurement/suppliers/:id/rate', authenticate, authorize(['suppliers.update']), rateSupplier);

// Procurement - Purchase Requests
router.get('/procurement/requests', authenticate, authorize(['purchase_requests.view']), getPurchaseRequests);
router.post('/procurement/requests', authenticate, authorize(['purchase_requests.create']), validate(createPurchaseRequestSchema), createPurchaseRequest);
router.put('/procurement/requests/:id', authenticate, authorize(['purchase_requests.update']), updatePurchaseRequest);
router.delete('/procurement/requests/:id', authenticate, authorize(['purchase_requests.delete']), deletePurchaseRequest);
router.put('/procurement/requests/:id/approve', authenticate, authorize(['purchase_requests.approve']), approvePurchaseRequest);
router.put('/procurement/requests/:id/reject', authenticate, authorize(['purchase_requests.approve']), rejectPurchaseRequest);

// Procurement - Purchase Orders
router.get('/procurement/orders', authenticate, authorize(['purchase_orders.view']), getPurchaseOrders);
router.post('/procurement/orders', authenticate, authorize(['purchase_orders.create']), validate(createPurchaseOrderSchema), createPurchaseOrder);
router.put('/procurement/orders/:id', authenticate, authorize(['purchase_orders.update']), updatePurchaseOrder);
router.delete('/procurement/orders/:id', authenticate, authorize(['purchase_orders.delete']), deletePurchaseOrder);
router.put('/procurement/orders/:id/status', authenticate, authorize(['purchase_orders.update']), updatePurchaseOrderStatus);
router.post('/procurement/orders/:id/receive', authenticate, authorize(['purchase_orders.create']), receivePurchaseOrder);

// Procurement - Invoices
router.get('/procurement/invoices', authenticate, authorize(['procurement.view']), getProcurementInvoices);
router.post('/procurement/invoices', authenticate, authorize(['procurement.create']), createProcurementInvoice);
router.put('/procurement/invoices/:id', authenticate, authorize(['procurement.update']), updateProcurementInvoice);
router.delete('/procurement/invoices/:id', authenticate, authorize(['procurement.delete']), deleteProcurementInvoice);
router.post('/procurement/invoices/:id/pay', authenticate, authorize(['procurement.update']), payProcurementInvoice);

// Procurement - Contracts
router.get('/procurement/contracts', authenticate, authorize(['procurement.view']), getProcurementContracts);
router.post('/procurement/contracts', authenticate, authorize(['procurement.create']), createProcurementContract);
router.put('/procurement/contracts/:id', authenticate, authorize(['procurement.update']), updateProcurementContract);
router.delete('/procurement/contracts/:id', authenticate, authorize(['procurement.delete']), deleteProcurementContract);
router.get('/procurement/contracts/expiring', authenticate, authorize(['procurement.view']), getExpiringProcurementContracts);

// Procurement - Reports
router.get('/procurement/reports', authenticate, authorize(['procurement.view']), getProcurementReports);

// Logistics - Vehicle Types
router.get('/logistics/vehicle-types', authenticate, authorize(['vehicles.view']), getVehicleTypes);
router.post('/logistics/vehicle-types', authenticate, authorize(['vehicles.create']), createVehicleType);

// Logistics - Vehicles
router.get('/logistics/vehicles', authenticate, authorize(['vehicles.view']), getVehicles);
router.post('/logistics/vehicles', authenticate, authorize(['vehicles.create']), validate(createVehicleSchema), createVehicle);
router.put('/logistics/vehicles/:id', authenticate, authorize(['vehicles.update']), updateVehicle);
router.delete('/logistics/vehicles/:id', authenticate, authorize(['vehicles.delete']), deleteVehicle);

// Logistics - Drivers
router.get('/logistics/drivers', authenticate, authorize(['drivers.view']), getDrivers);
router.post('/logistics/drivers', authenticate, authorize(['drivers.create']), validate(createDriverSchema), createDriver);
router.put('/logistics/drivers/:id', authenticate, authorize(['drivers.update']), updateDriver);
router.delete('/logistics/drivers/:id', authenticate, authorize(['drivers.delete']), deleteDriver);
router.get('/logistics/drivers/:id/history', authenticate, authorize(['drivers.view']), getDriverHistory);

// Logistics - Transport Requests
router.get('/logistics/requests', authenticate, authorize(['transport.view']), getTransportRequests);
router.post('/logistics/requests', authenticate, authorize(['transport.create']), validate(createTransportRequestSchema), createTransportRequest);
router.put('/logistics/requests/:id/approve', authenticate, authorize(['transport.approve']), approveTransportRequest);
router.put('/logistics/requests/:id/reject', authenticate, authorize(['transport.approve']), rejectTransportRequest);
router.delete('/logistics/requests/:id', authenticate, authorize(['transport.delete']), deleteTransportRequest);

// Logistics - Trips
router.get('/logistics/trips', authenticate, authorize(['trips.view']), getTrips);
router.post('/logistics/trips', authenticate, authorize(['trips.create']), validate(createTripSchema), createTrip);
router.put('/logistics/trips/:id', authenticate, authorize(['trips.update']), updateTrip);
router.delete('/logistics/trips/:id', authenticate, authorize(['trips.delete']), deleteTrip);
router.put('/logistics/trips/:id/status', authenticate, authorize(['trips.update']), updateTripStatus);

// Logistics - Deliveries
router.get('/logistics/deliveries', authenticate, authorize(['logistics.view']), getDeliveries);
router.post('/logistics/deliveries', authenticate, authorize(['logistics.create']), createDelivery);
router.put('/logistics/deliveries/:id', authenticate, authorize(['logistics.update']), updateDelivery);
router.delete('/logistics/deliveries/:id', authenticate, authorize(['logistics.delete']), deleteDelivery);
router.put('/logistics/deliveries/:id/status', authenticate, authorize(['logistics.update']), updateDeliveryStatus);

// Logistics - Fuel
router.get('/logistics/fuel', authenticate, authorize(['fuel.view']), getFuelRecords);
router.post('/logistics/fuel', authenticate, authorize(['fuel.create']), validate(createFuelRecordSchema), createFuelRecord);
router.put('/logistics/fuel/:id', authenticate, authorize(['fuel.update']), updateFuelRecord);
router.delete('/logistics/fuel/:id', authenticate, authorize(['fuel.delete']), deleteFuelRecord);

// Logistics - Maintenance
router.get('/logistics/maintenance', authenticate, authorize(['logistics.view']), getMaintenanceRecords);
router.post('/logistics/maintenance', authenticate, authorize(['logistics.create']), validate(createMaintenanceSchema), createMaintenanceRecord);
router.put('/logistics/maintenance/:id', authenticate, authorize(['logistics.update']), updateMaintenanceRecord);
router.delete('/logistics/maintenance/:id', authenticate, authorize(['logistics.delete']), deleteMaintenanceRecord);
router.get('/logistics/maintenance/due', authenticate, authorize(['logistics.view']), getDueMaintenance);

// Logistics - Reports
router.get('/logistics/reports', authenticate, authorize(['logistics.view']), getLogisticsReports);

// Accounting - Income
router.get('/accounting/income', authenticate, authorize(['income.view']), getIncomeRecords);
router.post('/accounting/income', authenticate, authorize(['income.create']), validate(createIncomeSchema), createIncomeRecord);
router.put('/accounting/income/:id', authenticate, authorize(['income.update']), updateIncomeRecord);
router.delete('/accounting/income/:id', authenticate, authorize(['income.delete']), deleteIncomeRecord);
router.get('/accounting/income/summary', authenticate, authorize(['income.view']), getIncomeSummary);

// Accounting - Expense Categories
router.get('/accounting/expense-categories', authenticate, authorize(['expenses.view']), getExpenseCategories);
router.post('/accounting/expense-categories', authenticate, authorize(['expenses.create']), createExpenseCategory);
router.put('/accounting/expense-categories/:id', authenticate, authorize(['expenses.update']), updateExpenseCategory);

// Accounting - Expenses
router.get('/accounting/expenses', authenticate, authorize(['expenses.view']), getExpenseRecords);
router.post('/accounting/expenses', authenticate, authorize(['expenses.create']), validate(createExpenseSchema), createExpenseRecord);
router.put('/accounting/expenses/:id', authenticate, authorize(['expenses.update']), updateExpenseRecord);
router.delete('/accounting/expenses/:id', authenticate, authorize(['expenses.delete']), deleteExpenseRecord);
router.get('/accounting/expenses/summary', authenticate, authorize(['expenses.view']), getExpenseSummary);

// Accounting - Invoices
router.get('/accounting/invoices', authenticate, authorize(['invoices.view']), getInvoices);
router.post('/accounting/invoices', authenticate, authorize(['invoices.create']), validate(createInvoiceSchema), createInvoice);
router.put('/accounting/invoices/:id', authenticate, authorize(['invoices.update']), updateInvoice);
router.delete('/accounting/invoices/:id', authenticate, authorize(['invoices.delete']), deleteInvoice);
router.put('/accounting/invoices/:id/status', authenticate, authorize(['invoices.update']), updateInvoiceStatus);
router.put('/accounting/invoices/:id/pay', authenticate, authorize(['invoices.update']), recordPayment);

// Accounting - Payroll
router.get('/accounting/payroll', authenticate, authorize(['payroll.view']), getPayrollRecords);
router.post('/accounting/payroll', authenticate, authorize(['payroll.create']), createPayroll);
router.put('/accounting/payroll/:id/process', authenticate, authorize(['payroll.update']), processPayrollPayment);
router.delete('/accounting/payroll/:id', authenticate, authorize(['payroll.delete']), deletePayrollRecord);

// Accounting - Salary Records
router.get('/accounting/salary-records', authenticate, authorize(['payroll.view']), getSalaryRecords);
router.post('/accounting/salary-records', authenticate, authorize(['payroll.create']), createSalaryRecord);

// Accounting - Budgets
router.get('/accounting/budgets', authenticate, authorize(['budgets.view']), getBudgets);
router.post('/accounting/budgets', authenticate, authorize(['budgets.create']), createBudget);
router.put('/accounting/budgets/:id', authenticate, authorize(['budgets.update']), updateBudget);
router.delete('/accounting/budgets/:id', authenticate, authorize(['budgets.delete']), deleteBudget);
router.put('/accounting/budgets/:id/status', authenticate, authorize(['budgets.update']), updateBudgetStatus);
router.get('/accounting/budgets/:id/vs-actual', authenticate, authorize(['budgets.view']), getBudgetVsActual);

// Accounting - Reports
router.get('/accounting/dashboard', authenticate, hasRole('owner', 'admin', 'accountant'), getAccountingDashboardHandler);
router.get('/accounting/reports/profit-loss', authenticate, authorize(['reports.view']), getProfitLoss);
router.get('/accounting/reports/cash-flow', authenticate, authorize(['reports.view']), getCashFlow);
router.get('/accounting/reports/summary', authenticate, authorize(['reports.view']), getFinancialSummary);
router.get('/accounting/reports', authenticate, authorize(['reports.view']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  const { start_date, end_date } = req.query;
  let dateWhere = '';
  const params: any[] = [];
  if (start_date && end_date) { dateWhere = ' WHERE date BETWEEN ? AND ?'; params.push(start_date, end_date); }
  try {
    const [incomeRows]: any = await pool.query(`SELECT source, SUM(amount) as total FROM income_records${dateWhere} GROUP BY source ORDER BY total DESC`, params);
    const incomeBySource: Record<string, number> = {};
    for (const r of incomeRows) incomeBySource[r.source] = Number(r.total);
    const [expenseRows]: any = await pool.query(`SELECT ec.name as category, SUM(e.amount) as total FROM expense_records e LEFT JOIN expense_categories ec ON e.category_id = ec.id${dateWhere.replace('date','e.date')} GROUP BY ec.name ORDER BY total DESC`, params.length ? params : []);
    const expenseByCategory: Record<string, number> = {};
    for (const r of expenseRows) expenseByCategory[r.category || 'Uncategorized'] = Number(r.total);
    const { success } = await import('../utils/response');
    return success(res, { incomeBySource, expenseByCategory });
  } catch (err: any) {
    const { error } = await import('../utils/response');
    return error(res, err.message);
  }
});

// Sales - Dashboard
router.get('/sales/dashboard', authenticate, authorize(['customers.view']), async (req, res) => {
  try {
    const pool = (await import('../config/database')).default;
    const { success } = await import('../utils/response');
    const [[{ monthSales }]]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as monthSales FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND deleted_at IS NULL");
    const [[{ pendingOrders }]]: any = await pool.query("SELECT COUNT(*) as pendingOrders FROM sales_orders WHERE status='pending' AND deleted_at IS NULL");
    const [[{ customersCount }]]: any = await pool.query("SELECT COUNT(*) as customersCount FROM customers WHERE deleted_at IS NULL");
    const [[{ customerRevenue }]]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as customerRevenue FROM sales_orders WHERE status='completed' AND deleted_at IS NULL");
    const [[{ totalProducts }]]: any = await pool.query("SELECT COUNT(*) as totalProducts FROM products WHERE deleted_at IS NULL");
    const [[{ completedOrders }]]: any = await pool.query("SELECT COUNT(*) as completedOrders FROM sales_orders WHERE status='completed' AND deleted_at IS NULL");
    const [recentOrders]: any = await pool.query("SELECT so.*, CONCAT(c.first_name,' ',c.last_name) as customer_name FROM sales_orders so LEFT JOIN customers c ON so.customer_id=c.id WHERE so.deleted_at IS NULL ORDER BY so.created_at DESC LIMIT 5");
    return success(res, { monthSales: Number(monthSales), pendingOrders, customersCount, customerRevenue: Number(customerRevenue), totalProducts: Number(totalProducts), completedOrders: Number(completedOrders), recentOrders });
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});

// Sales - Customers
router.get('/sales/customers', authenticate, authorize(['customers.view']), getCustomers);
router.post('/sales/customers', authenticate, authorize(['customers.create']), validate(createCustomerSchema), createCustomer);
router.put('/sales/customers/:id', authenticate, authorize(['customers.update']), updateCustomer);
router.delete('/sales/customers/:id', authenticate, authorize(['customers.delete']), deleteCustomer);

// Sales - Product Categories
router.get('/sales/product-categories', authenticate, authorize(['products.view']), getProductCategories);
router.post('/sales/product-categories', authenticate, authorize(['products.create']), createProductCategory);

// Sales - Products
router.get('/sales/products', authenticate, authorize(['products.view']), getProducts);
router.post('/sales/products', authenticate, authorize(['products.create']), validate(createProductSchema), createProduct);
router.put('/sales/products/:id', authenticate, authorize(['products.update']), updateProduct);
router.delete('/sales/products/:id', authenticate, authorize(['products.delete']), deleteProduct);
router.put('/sales/products/:id/stock', authenticate, authorize(['products.update']), updateProductStock);

// Sales - Orders
router.get('/sales/orders', authenticate, authorize(['orders.view']), getSalesOrders);
router.post('/sales/orders', authenticate, authorize(['orders.create']), validate(createSalesOrderSchema), createSalesOrder);
router.put('/sales/orders/:id', authenticate, authorize(['orders.update']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Order not found', 404);
    const { customer_id, order_date, status, total_amount, notes, items } = req.body;
    await pool.query('UPDATE sales_orders SET customer_id=?, order_date=?, status=?, total_amount=?, notes=? WHERE id=?',
      [customer_id || old[0].customer_id, order_date || old[0].order_date, status || old[0].status, total_amount || old[0].total_amount, notes ?? old[0].notes, req.params.id]);
    if (items && Array.isArray(items) && items.length > 0) {
      await pool.query('DELETE FROM sales_order_items WHERE order_id = ?', [req.params.id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?,?,?,?,?)',
          [req.params.id, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }
    return (await import('../utils/response')).success(res, null, 'Order updated');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});
router.put('/sales/orders/:id/status', authenticate, authorize(['orders.update']), updateSalesOrderStatus);
router.delete('/sales/orders/:id', authenticate, authorize(['orders.delete']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Order not found', 404);
    await pool.query('UPDATE sales_orders SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Order deleted');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});

// Sales - Quotations
router.get('/sales/quotations', authenticate, authorize(['orders.view']), getQuotations);
router.post('/sales/quotations', authenticate, authorize(['orders.create']), createQuotation);
router.put('/sales/quotations/:id', authenticate, authorize(['orders.update']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_quotations WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Quotation not found', 404);
    const { customer_id, total_amount, valid_until } = req.body;
    await pool.query('UPDATE sales_quotations SET customer_id=?, total_amount=?, valid_until=? WHERE id=?',
      [customer_id || old[0].customer_id, total_amount || old[0].total_amount, valid_until || old[0].valid_until, req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Quotation updated');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});
router.delete('/sales/quotations/:id', authenticate, authorize(['orders.delete']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_quotations WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Quotation not found', 404);
    await pool.query('DELETE FROM sales_quotations WHERE id = ?', [req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Quotation deleted');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});
router.put('/sales/quotations/:id/convert', authenticate, authorize(['orders.update']), convertQuotationToOrder);

// Sales - Invoices
router.get('/sales/invoices', authenticate, authorize(['sales_invoices.view']), getSalesInvoices);
router.post('/sales/invoices', authenticate, authorize(['sales_invoices.create']), createSalesInvoice);
router.put('/sales/invoices/:id', authenticate, authorize(['sales_invoices.update']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Invoice not found', 404);
    const { order_id, invoice_number, invoice_date, due_date, total_amount, status, notes } = req.body;
    await pool.query('UPDATE sales_invoices SET order_id=?, invoice_number=?, invoice_date=?, due_date=?, total_amount=?, status=?, notes=? WHERE id=?',
      [order_id || old[0].order_id, invoice_number || old[0].invoice_number, invoice_date || old[0].invoice_date, due_date ?? old[0].due_date, total_amount, status || old[0].status, notes ?? old[0].notes, req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Invoice updated');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});
router.delete('/sales/invoices/:id', authenticate, authorize(['sales_invoices.delete']), async (req, res) => {
  const pool = (await import('../config/database')).default;
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_invoices WHERE id = ?', [req.params.id]);
    if (old.length === 0) return (await import('../utils/response')).error(res, 'Invoice not found', 404);
    await pool.query('UPDATE sales_invoices SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return (await import('../utils/response')).success(res, null, 'Invoice deleted');
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});

// Sales - Reports
router.get('/sales/reports', authenticate, authorize(['orders.view']), async (req, res) => {
  try {
    const pool = (await import('../config/database')).default;
    const { success } = await import('../utils/response');
    const [[{ monthSales }]]: any = await pool.query("SELECT COALESCE(SUM(total_amount),0) as monthSales FROM sales_orders WHERE MONTH(order_date)=MONTH(CURDATE()) AND deleted_at IS NULL");
    const [topProducts]: any = await pool.query("SELECT p.name, SUM(soi.quantity) as sold, SUM(soi.total_price) as revenue FROM sales_order_items soi JOIN products p ON soi.product_id=p.id WHERE p.deleted_at IS NULL GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10");
    const [[{ activeCustomers }]]: any = await pool.query("SELECT COUNT(*) as activeCustomers FROM customers WHERE status = 'active' AND deleted_at IS NULL");
    return success(res, { monthSales: Number(monthSales), topProducts, activeCustomers });
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});

// Veterinary - Dashboard
router.get('/veterinary/dashboard', authenticate, authorize(['veterinary.view']), async (req, res) => {
  try {
    const pool = (await import('../config/database')).default;
    const { success } = await import('../utils/response');
    const [[{ openHealthRecords }]]: any = await pool.query("SELECT COUNT(*) as openHealthRecords FROM animal_health_records WHERE deleted_at IS NULL AND status='open'");
    const [[{ vaccinationsDue }]]: any = await pool.query("SELECT COUNT(*) as vaccinationsDue FROM vaccination_records WHERE next_due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");
    const [[{ treatmentsPending }]]: any = await pool.query("SELECT COUNT(*) as treatmentsPending FROM treatments WHERE deleted_at IS NULL");
    const [[{ totalHealthRecords }]]: any = await pool.query("SELECT COUNT(*) as totalHealthRecords FROM animal_health_records WHERE deleted_at IS NULL");
    const [[{ totalVaccinations }]]: any = await pool.query("SELECT COUNT(*) as totalVaccinations FROM vaccination_records WHERE deleted_at IS NULL");
    const [[{ totalPrescriptions }]]: any = await pool.query("SELECT COUNT(*) as totalPrescriptions FROM prescriptions WHERE deleted_at IS NULL");
    const [[{ sickAnimals }]]: any = await pool.query("SELECT COUNT(DISTINCT animal_id) as sickAnimals FROM animal_health_records WHERE deleted_at IS NULL AND status IN ('open','in_progress')");
    return success(res, { openHealthRecords, vaccinationsDue, treatmentsPending, totalHealthRecords, totalVaccinations, totalPrescriptions, sickAnimals });
  } catch (err: any) { return (await import('../utils/response')).error(res, err.message); }
});

// Veterinary - Health
router.get('/veterinary/health', authenticate, authorize(['veterinary.view']), getVeterinaryHealth);
router.get('/veterinary/health/:id', authenticate, authorize(['veterinary.view']), getVeterinaryHealthById);
router.post('/veterinary/health', authenticate, authorize(['veterinary.create']), validate(createHealthRecordSchema), createVeterinaryHealth);
router.put('/veterinary/health/:id', authenticate, authorize(['veterinary.update']), updateVeterinaryHealth);
router.delete('/veterinary/health/:id', authenticate, authorize(['veterinary.delete']), deleteVeterinaryHealth);

// Veterinary - Vaccination Schedule
router.get('/veterinary/vaccination-schedule', authenticate, authorize(['veterinary.view']), getVaccinationSchedule);
router.post('/veterinary/vaccination-schedule', authenticate, authorize(['veterinary.create']), createVaccinationSchedule);

// Veterinary - Vaccinations
router.get('/veterinary/vaccinations', authenticate, authorize(['vaccination.view']), getVetVaccinations);
router.post('/veterinary/vaccinations', authenticate, authorize(['vaccination.create']), validate(createVaccinationRecordSchema), createVetVaccination);
router.put('/veterinary/vaccinations/:id', authenticate, authorize(['vaccination.update']), updateVetVaccination);
router.delete('/veterinary/vaccinations/:id', authenticate, authorize(['vaccination.delete']), deleteVetVaccination);
router.get('/veterinary/vaccinations/due', authenticate, authorize(['vaccination.view']), getDueVaccinations);

// Veterinary - Prescriptions
router.get('/veterinary/prescriptions', authenticate, authorize(['veterinary.view']), getPrescriptions);
router.post('/veterinary/prescriptions', authenticate, authorize(['veterinary.create']), createPrescription);
router.put('/veterinary/prescriptions/:id', authenticate, authorize(['veterinary.update']), updatePrescription);
router.delete('/veterinary/prescriptions/:id', authenticate, authorize(['veterinary.delete']), deletePrescription);

// Veterinary - Treatments
router.get('/veterinary/treatments', authenticate, authorize(['health.view']), getTreatments);
router.post('/veterinary/treatments', authenticate, authorize(['health.create']), validate(createTreatmentSchema), createTreatment);
router.put('/veterinary/treatments/:id', authenticate, authorize(['health.update']), updateTreatment);
router.delete('/veterinary/treatments/:id', authenticate, authorize(['health.delete']), deleteTreatment);

// Veterinary - Treatment Prescriptions
router.get('/veterinary/treatments/:id/prescriptions', authenticate, authorize(['health.view']), getTreatmentPrescriptions);
router.post('/veterinary/treatments/:id/prescriptions', authenticate, authorize(['health.create']), createTreatmentPrescription);

// ──────────────────────────────────────────────────────────
// Additional Frontend Route Aliases (Milk, Stock, Accounting, etc.)
// ──────────────────────────────────────────────────────────

// Milk aliases (frontend uses shorter paths)
router.get('/milk/daily', authenticate, authorize(['milk_collection.view']), getDailyProduction);
router.get('/milk/monthly', authenticate, authorize(['milk_collection.view']), getMonthlyProduction);
router.get('/milk/alerts', authenticate, authorize(['milk_quality.view']), getQualityAlerts);
router.post('/milk/storage', authenticate, authorize(['milk_storage.create']), addMilkToStorage);
router.get('/milk/report', authenticate, authorize(['milk_storage.view']), getStorageReport);

// Stock aliases (frontend uses shorter paths)
router.get('/stock/low-stock', authenticate, authorize(['inventory.view']), getLowStockItems);
router.get('/stock/value', authenticate, authorize(['inventory.view']), getStockValue);
router.post('/stock/transactions/receive', authenticate, authorize(['stock.create']), validate(receiveStockSchema), receiveStock);
router.post('/stock/equipment/maintenance', authenticate, authorize(['equipment.update']), (req, res, next) => { const { default: pool } = require('../config/database'); (async () => { if (req.body.equipment_id) req.params.id = req.body.equipment_id; next(); })(); }, createEquipmentMaintenance);

// Accounting aliases (frontend uses shorter paths)
router.put('/accounting/invoices/:id/pay', authenticate, authorize(['invoices.update']), recordPayment);
router.get('/accounting/cash-flow', authenticate, authorize(['reports.view']), getCashFlow);
router.get('/accounting/summary', authenticate, authorize(['reports.view']), getFinancialSummary);

// Sales aliases
router.put('/sales/invoices/:id/pay', authenticate, authorize(['sales_invoices.update']), recordCustomerPayment);

// Veterinary aliases
router.get('/veterinary/health-records', authenticate, authorize(['veterinary.view']), getVeterinaryHealth);
router.post('/veterinary/health-records', authenticate, authorize(['veterinary.create']), validate(createHealthRecordSchema), createVeterinaryHealth);
router.put('/veterinary/health-records/:id', authenticate, authorize(['veterinary.update']), updateVeterinaryHealth);
router.delete('/veterinary/health-records/:id', authenticate, authorize(['veterinary.delete']), deleteVeterinaryHealth);

export default router;
