import api from './client';

export const authAPI = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  resetPassword: (id: number) => api.put(`/users/reset-password/${id}`),
  getManagers: () => api.get('/users/managers'),
};

export const departmentsAPI = {
  getAll: (params?: any) => api.get('/departments', { params }),
  create: (data: any) => api.post('/departments', data),
  update: (id: number, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

export const positionsAPI = {
  getAll: (params?: any) => api.get('/positions', { params }),
  create: (data: any) => api.post('/positions', data),
  update: (id: number, data: any) => api.put(`/positions/${id}`, data),
  delete: (id: number) => api.delete(`/positions/${id}`),
};

export const attendanceAPI = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  checkIn: (data: any) => api.post('/attendance/check-in', data),
  checkOut: (data: any) => api.post('/attendance/check-out', data),
  getReport: (params?: any) => api.get('/attendance/report', { params }),
  getToday: () => api.get('/attendance/today'),
  employeeCheckIn: () => api.post('/attendance/checkin'),
  employeeCheckOut: () => api.post('/attendance/checkout'),
};

export const activitiesAPI = {
  add: (data: any) => api.post('/activities', data),
  getMy: () => api.get('/activities/my'),
  getAll: (params?: any) => api.get('/activities', { params }),
};

export const leaveAPI = {
  getTypes: () => api.get('/leave-types'),
  createType: (data: any) => api.post('/leave-types', data),
  updateType: (id: number, data: any) => api.put(`/leave-types/${id}`, data),
  getRequests: (params?: any) => api.get('/leave-requests', { params }),
  createRequest: (data: any) => api.post('/leave-requests', data),
  approve: (id: number) => api.put(`/leave-requests/${id}/approve`),
  reject: (id: number, reason?: string) => api.put(`/leave-requests/${id}/reject`, { reason }),
  cancel: (id: number) => api.put(`/leave-requests/${id}/cancel`),
};

export const contractsAPI = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  create: (data: any) => api.post('/contracts', data),
  update: (id: number, data: any) => api.put(`/contracts/${id}`, data),
  terminate: (id: number, data: any) => api.put(`/contracts/${id}/terminate`, data),
  getExpiring: (params?: any) => api.get('/contracts/expiring', { params }),
};

export const performanceAPI = {
  getAll: (params?: any) => api.get('/performance-reviews', { params }),
  create: (data: any) => api.post('/performance-reviews', data),
  update: (id: number, data: any) => api.put(`/performance-reviews/${id}`, data),
};

export const trainingAPI = {
  getAll: (params?: any) => api.get('/training', { params }),
  create: (data: any) => api.post('/training', data),
  update: (id: number, data: any) => api.put(`/training/${id}`, data),
  getParticipants: (id: number) => api.get(`/training/${id}/participants`),
  enroll: (trainingId: number, userId: number) => api.post(`/training/${trainingId}/enroll`, { userId }),
  updateParticipant: (trainingId: number, participantId: number, data: any) => api.put(`/training/${trainingId}/participants/${participantId}`, data),
};

export const recruitmentAPI = {
  getJobs: (params?: any) => api.get('/recruitment/jobs', { params }),
  createJob: (data: any) => api.post('/recruitment/jobs', data),
  updateJob: (id: number, data: any) => api.put(`/recruitment/jobs/${id}`, data),
  closeJob: (id: number) => api.put(`/recruitment/jobs/${id}/close`),
  getApplicants: (params?: any) => api.get('/recruitment/applicants', { params }),
  createApplicant: (data: any) => api.post('/recruitment/applicants', data),
  updateStatus: (id: number, status: string) => api.put(`/recruitment/applicants/${id}/status`, { status }),
};

export const animalAPI = {
  getCategories: () => api.get('/animals/categories'),
  createCategory: (data: any) => api.post('/animals/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/animals/categories/${id}`, data),
  getBreeds: (params?: any) => api.get('/animals/breeds', { params }),
  createBreed: (data: any) => api.post('/animals/breeds', data),
  getAll: (params?: any) => api.get('/animals', { params }),
  getById: (id: number) => api.get(`/animals/${id}`),
  create: (data: any) => api.post('/animals', data),
  update: (id: number, data: any) => api.put(`/animals/${id}`, data),
  delete: (id: number) => api.delete(`/animals/${id}`),
};

export const breedingAPI = {
  getAll: (params?: any) => api.get('/breeding', { params }),
  create: (data: any) => api.post('/breeding', data),
  update: (id: number, data: any) => api.put(`/breeding/${id}`, data),
  deleteRecord: (id: number) => api.delete(`/breeding/${id}`),
  getPregnancies: (params?: any) => api.get('/breeding/pregnancies', { params }),
  createPregnancy: (data: any) => api.post('/breeding/pregnancies', data),
  updateStatus: (id: number, status: string) => api.put(`/breeding/pregnancies/${id}/status`, { status }),
  getBirths: (params?: any) => api.get('/breeding/births', { params }),
  createBirth: (data: any) => api.post('/breeding/births', data),
};

export const healthAPI = {
  getVaccinations: (params?: any) => api.get('/health/vaccinations', { params }),
  createVaccination: (data: any) => api.post('/health/vaccinations', data),
  getDiseases: (params?: any) => api.get('/health/diseases', { params }),
  createDisease: (data: any) => api.post('/health/diseases', data),
  updateStatus: (id: number, status: string) => api.put(`/health/diseases/${id}/status`, { status }),
  getTreatments: (params?: any) => api.get('/health/treatments', { params }),
  createTreatment: (data: any) => api.post('/health/treatments', data),
};

export const movementAPI = {
  getTransfers: (params?: any) => api.get('/movement/transfers', { params }),
  createTransfer: (data: any) => api.post('/movement/transfers', data),
  updateTransfer: (id: number, data: any) => api.put(`/movement/transfers/${id}`, data),
  deleteTransfer: (id: number) => api.delete(`/movement/transfers/${id}`),
  getPurchases: (params?: any) => api.get('/movement/purchases', { params }),
  createPurchase: (data: any) => api.post('/movement/purchases', data),
  getSales: (params?: any) => api.get('/movement/sales', { params }),
  createSale: (data: any) => api.post('/movement/sales', data),
  getDeaths: (params?: any) => api.get('/movement/deaths', { params }),
  createDeath: (data: any) => api.post('/movement/deaths', data),
  getWeights: (params?: any) => api.get('/movement/weights', { params }),
  createWeight: (data: any) => api.post('/movement/weights', data),
};

export const feedingAPI = {
  getAll: (params?: any) => api.get('/feeding', { params }),
  create: (data: any) => api.post('/feeding', data),
  update: (id: number, data: any) => api.put(`/feeding/${id}`, data),
  deleteRecord: (id: number) => api.delete(`/feeding/${id}`),
  getReport: (params?: any) => api.get('/feeding/report', { params }),
};

export const milkAPI = {
  getCollections: (params?: any) => api.get('/milk/collections', { params }),
  createCollection: (data: any) => api.post('/milk/collections', data),
  updateCollection: (id: number, data: any) => api.put(`/milk/collections/${id}`, data),
  delete: (id: number) => api.delete(`/milk/collections/${id}`),
  getDaily: (params?: any) => api.get('/milk/daily', { params }),
  getMonthly: (params?: any) => api.get('/milk/monthly', { params }),
  getQuality: (params?: any) => api.get('/milk/quality', { params }),
  createQuality: (data: any) => api.post('/milk/quality', data),
  updateQuality: (id: number, data: any) => api.put(`/milk/quality/${id}`, data),
  deleteQuality: (id: number) => api.delete(`/milk/quality/${id}`),
  getAlerts: () => api.get('/milk/alerts'),
  getTanks: () => api.get('/milk/tanks'),
  createTank: (data: any) => api.post('/milk/tanks', data),
  updateTank: (id: number, data: any) => api.put(`/milk/tanks/${id}`, data),
  getStorage: (params?: any) => api.get('/milk/storage', { params }),
  addToStorage: (data: any) => api.post('/milk/storage', data),
  getReport: (params?: any) => api.get('/milk/report', { params }),
  getProcessing: (params?: any) => api.get('/milk/processing', { params }),
  createProcessing: (data: any) => api.post('/milk/processing', data),
  updateProcessing: (id: number, data: any) => api.put(`/milk/processing/${id}`, data),
  deleteProcessing: (id: number) => api.delete(`/milk/processing/${id}`),
  getProducts: (params?: any) => api.get('/milk/products', { params }),
  createProduct: (data: any) => api.post('/milk/products', data),
  updateProduct: (id: number, data: any) => api.put(`/milk/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/milk/products/${id}`),
  getWaste: (params?: any) => api.get('/milk/waste', { params }),
  createWaste: (data: any) => api.post('/milk/waste', data),
  updateWaste: (id: number, data: any) => api.put(`/milk/waste/${id}`, data),
  deleteWaste: (id: number) => api.delete(`/milk/waste/${id}`),
};

export const stockAPI = {
  getCategories: () => api.get('/stock/categories'),
  createCategory: (data: any) => api.post('/stock/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/stock/categories/${id}`, data),
  getAllItems: (params?: any) => api.get('/stock/all-items', { params }),
  getItems: (params?: any) => api.get('/stock/items', { params }),
  createItem: (data: any) => api.post('/stock/items', data),
  updateItem: (id: number, data: any) => api.put(`/stock/items/${id}`, data),
  delete: (id: number) => api.delete(`/stock/items/${id}`),
  getLowStock: () => api.get('/stock/low-stock'),
  getValue: () => api.get('/stock/value'),
  getTransactions: (params?: any) => api.get('/stock/transactions', { params }),
  receive: (data: any) => api.post('/stock/transactions/receive', data),
  getFeed: (params?: any) => api.get('/stock/feed', { params }),
  createFeed: (data: any) => api.post('/stock/feed', data),
  updateFeed: (id: number, data: any) => api.put(`/stock/feed/${id}`, data),
  deleteFeed: (id: number) => api.delete(`/stock/feed/${id}`),
  getFeedConsumption: (params?: any) => api.get('/stock/feed/consumption', { params }),
  recordConsumption: (data: any) => api.post('/stock/feed/consumption', data),
  getFeedReport: (params?: any) => api.get('/stock/feed/report', { params }),
  getMedicines: (params?: any) => api.get('/stock/medicines', { params }),
  createMedicine: (data: any) => api.post('/stock/medicines', data),
  updateMedicine: (id: number, data: any) => api.put(`/stock/medicines/${id}`, data),
  getExpiring: (params?: any) => api.get('/stock/medicines/expiring', { params }),
  getExpired: (params?: any) => api.get('/stock/medicines/expired', { params }),
  getEquipment: (params?: any) => api.get('/stock/equipment', { params }),
  createEquipment: (data: any) => api.post('/stock/equipment', data),
  updateEquipment: (id: number, data: any) => api.put(`/stock/equipment/${id}`, data),
  deleteEquipment: (id: number) => api.delete(`/stock/equipment/${id}`),
  recordMaintenance: (data: any) => api.post('/stock/equipment/maintenance', data),
};

export const procurementAPI = {
  getSupplierCategories: () => api.get('/procurement/supplier-categories'),
  createSupplierCategory: (data: any) => api.post('/procurement/supplier-categories', data),
  updateSupplierCategory: (id: number, data: any) => api.put(`/procurement/supplier-categories/${id}`, data),
  getSuppliers: (params?: any) => api.get('/procurement/suppliers', { params }),
  createSupplier: (data: any) => api.post('/procurement/suppliers', data),
  updateSupplier: (id: number, data: any) => api.put(`/procurement/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/procurement/suppliers/${id}`),
  rateSupplier: (id: number, data: any) => api.post(`/procurement/suppliers/${id}/rate`, data),
  getRatings: (id: number) => api.get(`/procurement/suppliers/${id}/ratings`),
  getRequests: (params?: any) => api.get('/procurement/requests', { params }),
  createRequest: (data: any) => api.post('/procurement/requests', data),
  approve: (id: number) => api.put(`/procurement/requests/${id}/approve`),
  reject: (id: number, reason?: string) => api.put(`/procurement/requests/${id}/reject`, { reason }),
  getOrders: (params?: any) => api.get('/procurement/orders', { params }),
  createOrder: (data: any) => api.post('/procurement/orders', data),
  updateStatus: (id: number, status: string) => api.put(`/procurement/orders/${id}/status`, { status }),
  getInvoices: (params?: any) => api.get('/procurement/invoices', { params }),
  createInvoice: (data: any) => api.post('/procurement/invoices', data),
  updateInvoice: (id: number, data: any) => api.put(`/procurement/invoices/${id}`, data),
  deleteInvoice: (id: number) => api.delete(`/procurement/invoices/${id}`),
  payInvoice: (id: number) => api.post(`/procurement/invoices/${id}/pay`),
  deleteContract: (id: number) => api.delete(`/procurement/contracts/${id}`),
  getContracts: (params?: any) => api.get('/procurement/contracts', { params }),
  createContract: (data: any) => api.post('/procurement/contracts', data),
  updateContract: (id: number, data: any) => api.put(`/procurement/contracts/${id}`, data),
  getExpiringContracts: (params?: any) => api.get('/procurement/contracts/expiring', { params }),
};

export const logisticsAPI = {
  getVehicleTypes: () => api.get('/logistics/vehicle-types'),
  createVehicleType: (data: any) => api.post('/logistics/vehicle-types', data),
  getVehicles: (params?: any) => api.get('/logistics/vehicles', { params }),
  createVehicle: (data: any) => api.post('/logistics/vehicles', data),
  updateVehicle: (id: number, data: any) => api.put(`/logistics/vehicles/${id}`, data),
  delete: (id: number) => api.delete(`/logistics/vehicles/${id}`),
  getDrivers: (params?: any) => api.get('/logistics/drivers', { params }),
  createDriver: (data: any) => api.post('/logistics/drivers', data),
  updateDriver: (id: number, data: any) => api.put(`/logistics/drivers/${id}`, data),
  deleteDriver: (id: number) => api.delete(`/logistics/drivers/${id}`),
  getHistory: (vehicleId: number) => api.get(`/logistics/vehicles/${vehicleId}/history`),
  getRequests: (params?: any) => api.get('/logistics/requests', { params }),
  createRequest: (data: any) => api.post('/logistics/requests', data),
  approve: (id: number) => api.put(`/logistics/requests/${id}/approve`),
  reject: (id: number, reason?: string) => api.put(`/logistics/requests/${id}/reject`, { rejection_reason: reason }),
  getTrips: (params?: any) => api.get('/logistics/trips', { params }),
  createTrip: (data: any) => api.post('/logistics/trips', data),
  updateStatus: (id: number, status: string) => api.put(`/logistics/trips/${id}/status`, { status }),
  getDeliveries: (params?: any) => api.get('/logistics/deliveries', { params }),
  createDelivery: (data: any) => api.post('/logistics/deliveries', data),
  updateDeliveryStatus: (id: number, status: string) => api.put(`/logistics/deliveries/${id}/status`, { status }),
  getFuel: (params?: any) => api.get('/logistics/fuel', { params }),
  createFuel: (data: any) => api.post('/logistics/fuel', data),
  getMaintenance: (params?: any) => api.get('/logistics/maintenance', { params }),
  createMaintenance: (data: any) => api.post('/logistics/maintenance', data),
  updateMaintenance: (id: number, data: any) => api.put(`/logistics/maintenance/${id}`, data),
  deleteMaintenance: (id: number) => api.delete(`/logistics/maintenance/${id}`),
  getDueMaintenance: () => api.get('/logistics/maintenance/due'),
  deleteRequest: (id: number) => api.delete(`/logistics/requests/${id}`),
};

export const accountingAPI = {
  getIncome: (params?: any) => api.get('/accounting/income', { params }),
  createIncome: (data: any) => api.post('/accounting/income', data),
  updateIncome: (id: number, data: any) => api.put(`/accounting/income/${id}`, data),
  deleteIncome: (id: number) => api.delete(`/accounting/income/${id}`),
  getIncomeSummary: (params?: any) => api.get('/accounting/income/summary', { params }),
  getExpenseCategories: () => api.get('/accounting/expense-categories'),
  createExpenseCategory: (data: any) => api.post('/accounting/expense-categories', data),
  getExpenses: (params?: any) => api.get('/accounting/expenses', { params }),
  createExpense: (data: any) => api.post('/accounting/expenses', data),
  updateExpense: (id: number, data: any) => api.put(`/accounting/expenses/${id}`, data),
  deleteExpense: (id: number) => api.delete(`/accounting/expenses/${id}`),
  getExpenseSummary: (params?: any) => api.get('/accounting/expenses/summary', { params }),
  getInvoices: (params?: any) => api.get('/accounting/invoices', { params }),
  createInvoice: (data: any) => api.post('/accounting/invoices', data),
  updateInvoice: (id: number, data: any) => api.put(`/accounting/invoices/${id}`, data),
  deleteInvoice: (id: number) => api.delete(`/accounting/invoices/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/accounting/invoices/${id}/status`, { status }),
  payInvoice: (id: number) => api.put(`/accounting/invoices/${id}/pay`),
  getPayroll: (params?: any) => api.get('/accounting/payroll', { params }),
  createPayroll: (data: any) => api.post('/accounting/payroll', data),
  processPayroll: (id: number) => api.put(`/accounting/payroll/${id}/process`),
  getSalaryRecords: (params?: any) => api.get('/accounting/salary-records', { params }),
  createSalaryRecord: (data: any) => api.post('/accounting/salary-records', data),
  getBudgets: (params?: any) => api.get('/accounting/budgets', { params }),
  createBudget: (data: any) => api.post('/accounting/budgets', data),
  updateBudget: (id: number, data: any) => api.put(`/accounting/budgets/${id}`, data),
  deleteBudget: (id: number) => api.delete(`/accounting/budgets/${id}`),
  updateBudgetStatus: (id: number, status: string) => api.put(`/accounting/budgets/${id}/status`, { status }),
  getBudgetVsActual: (params?: any) => api.get('/accounting/budgets/vs-actual', { params }),
  getProfitLoss: (params?: any) => api.get('/accounting/profit-loss', { params }),
  getCashFlow: (params?: any) => api.get('/accounting/cash-flow', { params }),
  getFinancialSummary: () => api.get('/accounting/summary'),
};

export const salesAPI = {
  getCustomers: (params?: any) => api.get('/sales/customers', { params }),
  createCustomer: (data: any) => api.post('/sales/customers', data),
  updateCustomer: (id: number, data: any) => api.put(`/sales/customers/${id}`, data),
  deleteCustomer: (id: number) => api.delete(`/sales/customers/${id}`),
  getProductCategories: () => api.get('/sales/product-categories'),
  createProductCategory: (data: any) => api.post('/sales/product-categories', data),
  getProducts: (params?: any) => api.get('/sales/products', { params }),
  createProduct: (data: any) => api.post('/sales/products', data),
  updateProduct: (id: number, data: any) => api.put(`/sales/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/sales/products/${id}`),
  updateStock: (id: number, data: any) => api.put(`/sales/products/${id}/stock`, data),
  getOrders: (params?: any) => api.get('/sales/orders', { params }),
  createOrder: (data: any) => api.post('/sales/orders', data),
  updateOrder: (id: number, data: any) => api.put(`/sales/orders/${id}`, data),
  deleteOrder: (id: number) => api.delete(`/sales/orders/${id}`),
  updateStatus: (id: number, status: string) => api.put(`/sales/orders/${id}/status`, { status }),
  getQuotations: (params?: any) => api.get('/sales/quotations', { params }),
  createQuotation: (data: any) => api.post('/sales/quotations', data),
  convertToOrder: (id: number) => api.put(`/sales/quotations/${id}/convert`),
  getInvoices: (params?: any) => api.get('/sales/invoices', { params }),
  createInvoice: (data: any) => api.post('/sales/invoices', data),
  updateInvoice: (id: number, data: any) => api.put(`/sales/invoices/${id}`, data),
  deleteInvoice: (id: number) => api.delete(`/sales/invoices/${id}`),
  payInvoice: (id: number) => api.put(`/sales/invoices/${id}/pay`),
  getDashboard: () => api.get('/sales/dashboard'),
  getReports: (params?: any) => api.get('/sales/reports', { params }),
};

export const veterinaryAPI = {
  getHealthRecords: (params?: any) => api.get('/veterinary/health-records', { params }),
  createHealthRecord: (data: any) => api.post('/veterinary/health-records', data),
  updateHealthRecord: (id: number, data: any) => api.put(`/veterinary/health-records/${id}`, data),
  deleteHealthRecord: (id: number) => api.delete(`/veterinary/health-records/${id}`),
  getVaccinationSchedule: (params?: any) => api.get('/veterinary/vaccination-schedule', { params }),
  createVaccinationSchedule: (data: any) => api.post('/veterinary/vaccination-schedule', data),
  getVaccinations: (params?: any) => api.get('/veterinary/vaccinations', { params }),
  createVaccination: (data: any) => api.post('/veterinary/vaccinations', data),
  updateVaccination: (id: number, data: any) => api.put(`/veterinary/vaccinations/${id}`, data),
  deleteVaccination: (id: number) => api.delete(`/veterinary/vaccinations/${id}`),
  getDueVaccinations: () => api.get('/veterinary/vaccinations/due'),
  getTreatments: (params?: any) => api.get('/veterinary/treatments', { params }),
  createTreatment: (data: any) => api.post('/veterinary/treatments', data),
  updateTreatment: (id: number, data: any) => api.put(`/veterinary/treatments/${id}`, data),
  deleteTreatment: (id: number) => api.delete(`/veterinary/treatments/${id}`),
  getPrescriptions: (params?: any) => api.get('/veterinary/prescriptions', { params }),
  createPrescription: (data: any) => api.post('/veterinary/prescriptions', data),
  updatePrescription: (id: number, data: any) => api.put(`/veterinary/prescriptions/${id}`, data),
  deletePrescription: (id: number) => api.delete(`/veterinary/prescriptions/${id}`),
  getDashboard: () => api.get('/veterinary/dashboard'),
};

export const dashboardAPI = {
  getHR: () => api.get('/dashboard/hr'),
  getAnimals: () => api.get('/dashboard/animals'),
  getMilk: () => api.get('/dashboard/milk'),
  getStock: () => api.get('/dashboard/stock'),
  getProcurement: () => api.get('/dashboard/procurement'),
  getLogistics: () => api.get('/dashboard/logistics'),
  getAccounting: () => api.get('/dashboard/accounting'),
  getSales: () => api.get('/dashboard/sales'),
  getVeterinary: () => api.get('/dashboard/veterinary'),
};

export const reportsAPI = {
  submit: (data: any) => api.post('/reports', data),
  getMy: () => api.get('/reports/my'),
  getDepartment: (params?: any) => api.get('/reports/department', { params }),
  approve: (id: number, comment?: string) => api.put(`/reports/${id}/approve`, { comment }),
  reject: (id: number, comment: string) => api.put(`/reports/${id}/reject`, { comment }),
};
