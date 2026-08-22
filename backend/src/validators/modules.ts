import { z } from 'zod';

export const createPositionSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  salary_range_min: z.number().positive().optional(),
  salary_range_max: z.number().positive().optional(),
}).passthrough();

export const updatePositionSchema = createPositionSchema.partial();

export const createAttendanceSchema = z.object({
  employee_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  check_in: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)').optional(),
  notes: z.string().optional(),
});

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  days_allowed: z.number().int().positive(),
  requires_approval: z.boolean().optional().default(true),
});

export const createLeaveRequestSchema = z.object({
  employee_id: z.number().int().positive(),
  leave_type_id: z.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1, 'Reason is required'),
});

export const createContractSchema = z.object({
  employee_id: z.number().int().positive().optional(),
  user_id: z.number().int().positive().optional(),
  type: z.string().min(1, 'Type is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  salary: z.number().positive().optional(),
  salary_amount: z.string().optional(),
  terms: z.string().optional(),
}).passthrough();

export const updateContractSchema = createContractSchema.partial().extend({
  status: z.enum(['active', 'terminated', 'expired']).optional(),
});

export const createPerformanceReviewSchema = z.object({
  employee_id: z.number().int().positive().optional(),
  user_id: z.number().int().positive().optional(),
  reviewer_id: z.number().int().positive().optional(),
  reviewer_name: z.string().optional(),
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating: z.number().int().min(1).max(5).optional(),
  score: z.number().positive().optional(),
  notes: z.string().optional(),
  comments: z.string().optional(),
}).passthrough();

export const createTrainingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  trainer: z.string().optional(),
  location: z.string().optional(),
  max_participants: z.number().int().positive().optional(),
}).passthrough();

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  salary_range: z.string().optional(),
  status: z.string().optional().default('open'),
}).passthrough();

export const createApplicantSchema = z.object({
  job_id: z.number().int().positive(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
  resume_url: z.string().url().optional(),
  cover_letter: z.string().optional(),
});

export const createAnimalCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
}).passthrough();

export const createAnimalSchema = z.object({
  tag_number: z.string().min(1, 'Tag number is required'),
  name: z.string().optional().nullable(),
  animal_category_id: z.number().int().positive(),
  breed_id: z.number().int().positive().optional().nullable(),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.preprocess((v) => (v === '' || v === undefined || v === null ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  weight: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  color: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  purchase_price: z.number().positive().optional().nullable(),
  is_dairy: z.boolean().optional().nullable(),
  location_id: z.number().int().positive().optional().nullable(),
  group_id: z.number().int().positive().optional().nullable(),
  photo: z.string().optional().nullable(),
  feed_type: z.string().optional().nullable(),
  animal_status: z.string().optional().nullable(),
  registration_date: z.string().optional().nullable(),
}).passthrough();

export const updateAnimalSchema = createAnimalSchema.partial();

export const createBreedingRecordSchema = z.object({
  mother_id: z.number().int().positive(),
  father_id: z.number().int().positive().optional().nullable(),
  breeding_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(['natural', 'artificial', 'ai']).optional().nullable(),
  insemination_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  technician: z.string().max(200).optional().nullable(), // free text, NOT a select
  notes: z.string().optional().nullable(),
}).passthrough();

export const createPregnancySchema = z.object({
  animal_id: z.number().int().positive(),
  breeding_id: z.number().int().positive().optional().nullable(),
  pregnancy_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expected_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sire_name: z.string().optional().nullable(),
  status: z.enum(['Pregnant', 'Under Observation', 'Delivered', 'Failed', 'Aborted', 'confirmed', 'monitoring', 'ended', 'delivered']).optional().default('Pregnant'),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createBirthRecordSchema = z.object({
  mother_id: z.number().int().positive(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tag_number: z.string().optional().nullable(),
  animal_name: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  health_status: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  animal_id: z.number().int().positive().optional().nullable(),
  child_name: z.string().optional().nullable(),
  ear_tag: z.string().optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  color: z.string().optional().nullable(),
}).passthrough();

export const createVaccinationSchema = z.object({
  animal_id: z.number().int().positive(),
  vaccine_name: z.string().min(1, 'Vaccine name is required'),
  vaccination_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  veterinarian: z.union([z.string(), z.number()]).optional().nullable(),
  batch_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createDiseaseSchema = z.object({
  animal_id: z.number().int().positive(),
  disease_name: z.string().min(1, 'Disease name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  symptoms: z.string().optional().nullable(),
  severity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createTreatmentSchema = z.object({
  animal_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  disease_id: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
  medicine: z.string().optional().default(''),
  dosage: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  veterinarian: z.string().optional().nullable(),
  cost: z.union([z.number().positive(), z.string()]).optional().nullable(),
  notes: z.string().optional().nullable(),
  treatment_type: z.string().optional().nullable(),
  treatment_date: z.string().optional().nullable(),
  treatment_description: z.string().optional().nullable(),
  medication: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  disease_name: z.string().optional().nullable(),
  animal: z.string().optional().nullable(),
}).passthrough();

export const createFeedingRecordSchema = z.object({
  animal_id: z.number().int().positive(),
  feed_type: z.string().min(1, 'Feed type is required'),
  quantity: z.number().positive(),
  unit: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createWeightRecordSchema = z.object({
  animal_id: z.number().int().positive(),
  weight: z.number().positive(),
  weight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createMilkCollectionSchema = z.object({
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.enum(['morning', 'evening']),
  collector_name: z.string().optional().nullable(),
  collector_id: z.number().int().positive().optional().nullable(),
  branch_id: z.number().int().positive().optional().nullable(),
  quantity_liters: z.number().positive(),
  number_of_animals: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough().refine(data => data.collector_name || data.collector_id, {
  message: 'Either collector_name or collector_id is required',
});

export const createQualityTestSchema = z.object({
  collection_id: z.number().int().positive(),
  test_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fat: z.number().optional().nullable(),
  protein: z.number().optional().nullable(),
  snf: z.number().optional().nullable(),
  lactose: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  ph: z.number().optional().nullable(),
  result: z.enum(['pass', 'fail', 'conditional']).optional().nullable(),
}).passthrough();

export const createStorageTankSchema = z.object({
  name: z.string().optional().nullable(),
  tank_name: z.string().min(1, 'Tank name is required'),
  capacity: z.number().positive().optional().nullable(),
  capacity_liters: z.number().positive().optional().nullable(),
  current_volume: z.number().min(0).optional().default(0),
  location: z.string().optional().nullable(),
  tank_number: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createInventoryCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
}).passthrough();

export const createInventoryItemSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional().nullable(),
  quantity: z.number().int().min(0).optional().default(0),
  unit_price: z.number().positive().optional().nullable(),
  reorder_level: z.number().int().min(0).optional().default(0),
  description: z.string().optional().nullable(),
}).passthrough();

export const receiveStockSchema = z.object({
  item_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive().optional().nullable(),
  supplier_id: z.number().int().positive().optional().nullable(),
  received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional().nullable(),
}).passthrough();


export const createSupplierSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  name: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
}).passthrough();

export const createPurchaseRequestSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unit: z.string().optional().nullable(),
  estimated_cost: z.number().positive().optional().nullable(),
  requested_by: z.union([z.number(), z.string()]).optional(),
  department_id: z.number().int().positive().optional().nullable(),
  required_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.number().int().positive(),
  cost: z.number().positive().optional().nullable(),
  status: z.string().optional().nullable(),
  request_id: z.number().int().positive().optional().nullable(),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expected_delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  items: z.array(z.object({
    item_name: z.string().min(1, 'Item name is required'),
    description: z.string().optional().nullable(),
    quantity: z.number().int().positive(),
    unit: z.string().optional().nullable(),
    unit_price: z.number().positive(),
    total_price: z.number().positive().optional().nullable(),
  })).optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createVehicleSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required'),
  vehicle_name: z.string().optional().nullable(),
  plate_number: z.string().min(1, 'Plate number is required'),
  type: z.string().optional().nullable(),
  type_id: z.number().int().positive().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  capacity: z.number().positive().optional().nullable(),
  status: z.enum(['available', 'in-use', 'maintenance', 'out-of-service', 'retired']).optional().default('available'),
}).passthrough();

export const createDriverSchema = z.object({
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  license_number: z.string().min(1, 'License number is required'),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  national_id: z.string().optional().nullable(),
  license_type: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  status: z.string().optional().default('available'),
}).passthrough();

export const createTransportRequestSchema = z.object({
  department_id: z.number().int().positive().optional().nullable(),
  pickup_location: z.string().min(1, 'Pickup location is required'),
  destination: z.string().min(1, 'Destination is required'),
  required_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  priority: z.string().optional().default('normal'),
}).passthrough();

export const createTripSchema = z.object({
  vehicle_id: z.number().int().positive(),
  driver_id: z.number().int().positive(),
  request_id: z.number().int().positive().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  distance: z.number().positive().optional().nullable(),
  fuel_used: z.number().positive().optional().nullable(),
  destination: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'started', 'in_progress', 'completed', 'cancelled']).optional().default('scheduled'),
}).passthrough();

export const createFuelRecordSchema = z.object({
  vehicle_id: z.number().int().positive(),
  quantity: z.number().positive(),
  cost: z.number().positive().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fuel_type: z.string().optional().nullable(),
  mileage: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createMaintenanceSchema = z.object({
  vehicle_id: z.number().int().positive(),
  equipment_id: z.number().int().positive().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maintenance_type: z.string().min(1, 'Type is required'),
  description: z.string().optional().nullable(),
  cost: z.number().positive().optional().nullable(),
  next_service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
}).passthrough();

export const createIncomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().optional().default(''),
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
}).passthrough();

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().optional(),
  category_id: z.union([z.number(), z.string()]).optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_method: z.string().optional().nullable(),
  department_id: z.union([z.number(), z.string()]).optional().nullable(),
  vendor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createInvoiceSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).optional().nullable(),
  invoice_number: z.string().optional(),
  type: z.string().optional().default('income'),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).optional().default([]),
  tax: z.number().optional().default(0),
  total_amount: z.number().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createCustomerSchema = z.object({
  name: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  customer_code: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  initial_payment: z.union([z.string(), z.number()]).optional(),
  product_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/), z.null()]).optional(),
  quantity: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/), z.null()]).optional(),
  payment_method: z.string().optional().nullable(),
}).passthrough();

export const createProductSchema = z.object({
  category_id: z.union([z.number(), z.string()]).optional().nullable(),
  category_name: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  price: z.number().min(0),
  cost_price: z.number().optional().nullable(),
  quantity_available: z.number().optional().nullable(),
  quantity: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
}).passthrough();

export const createSalesOrderSchema = z.object({
  customer_id: z.union([z.number(), z.string()]).optional().nullable(),
  order_date: z.string().optional().nullable(),
  order_number: z.string().optional().nullable(),
  items: z.array(z.object({
    product_id: z.number().int().positive(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
  })).optional().default([]),
  product_id: z.number().int().positive().optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  unit_price: z.number().positive().optional().nullable(),
  total_amount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();

export const createHealthRecordSchema = z.object({
  animal_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  date: z.string().optional().nullable(),
  checkup_date: z.string().optional().nullable(),
  record_date: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
  symptoms: z.string().optional().nullable(),
  veterinarian: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
}).passthrough();

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50),
  slug: z.string().min(1, 'Slug is required').max(50).regex(/^[a-z0-9_]+$/, 'Slug must be lowercase with underscores'),
  description: z.string().optional().nullable(),
});

export const createVaccinationRecordSchema = z.object({
  animal_id: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  vaccine: z.string().optional().nullable(),
  vaccine_name: z.string().optional().nullable(),
  vaccination_date: z.string().optional().nullable(),
  next_due_date: z.string().optional().nullable(),
  administered_by: z.string().optional().nullable(),
  veterinarian: z.string().optional().nullable(),
  batch_number: z.string().optional().nullable(),
  cost: z.union([z.number().positive(), z.string()]).optional().nullable(),
  notes: z.string().optional().nullable(),
}).passthrough();
