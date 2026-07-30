const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'efms', waitForConnections: true, connectionLimit: 1 });

  // ACCOUNTING: Create Income via API
  // First, let's test via direct DB to keep it simple
  const [income] = await pool.query(
    `INSERT INTO income_records (amount, source, description, date, payment_method, created_by, created_at) VALUES (?,?,?,?,?,?,NOW())`,
    [500, 'Test Source', 'Test Income CRUD', '2026-07-30', 'cash', 1]
  );
  console.log('✅ Income created: ID', income.insertId);

  // Create Expense
  const [expense] = await pool.query(
    `INSERT INTO expense_records (amount, category, description, date, vendor, created_by, created_at) VALUES (?,?,?,?,?,?,NOW())`,
    [300, 'Feed', 'Test Expense CRUD', '2026-07-30', 'Test Vendor', 1]
  );
  console.log('✅ Expense created: ID', expense.insertId);

  // ANIMAL: Register Cattle (animal_category_id=1)
  const [animal] = await pool.query(
    `INSERT INTO animals (tag_number, name, animal_category_id, breed_id, gender, date_of_birth, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,NOW())`,
    ['TEST-CAT-001', 'Test Cattle', 1, 1, 'male', '2025-01-01', 'active', 1]
  );
  console.log('✅ Cattle created: ID', animal.insertId);

  // Register Pig (animal_category_id=2)
  const [pig] = await pool.query(
    `INSERT INTO animals (tag_number, name, animal_category_id, breed_id, gender, date_of_birth, status, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,NOW())`,
    ['TEST-PIG-001', 'Test Pig', 2, 5, 'female', '2025-06-01', 'active', 1]
  );
  console.log('✅ Pig created: ID', pig.insertId);

  // VETERINARY: Create Health Record
  const [health] = await pool.query(
    `INSERT INTO animal_health_records (animal_id, checkup_date, diagnosis, prescription, notes, veterinarian, status, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
    [animal.insertId, '2026-07-30', 'Test diagnosis', 'Test prescription', 'Test notes', 1, 'open']
  );
  console.log('✅ Health Record created: ID', health.insertId);

  // Create Vaccination
  const [vaccination] = await pool.query(
    `INSERT INTO vaccination_records (animal_id, vaccine_name, vaccination_date, next_due_date, veterinarian, notes, created_at) VALUES (?,?,?,?,?,?,NOW())`,
    [animal.insertId, 'Test Vaccine', '2026-07-30', '2026-08-30', 'Dr. Test', 'Test vaccination']
  );
  console.log('✅ Vaccination created: ID', vaccination.insertId);

  // Create Treatment
  const [treatment] = await pool.query(
    `INSERT INTO treatments (animal_id, diagnosis, medicine, treatment_description, treatment_date, veterinarian_name, notes, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
    [animal.insertId, 'Test Treatment', 'Test Med', 'Test treatment desc', '2026-07-30', 'Dr. Test', 'Test notes']
  );
  console.log('✅ Treatment created: ID', treatment.insertId);

  // Create Prescription
  const [prescription] = await pool.query(
    `INSERT INTO prescriptions (animal_id, medicine, dosage, duration, notes, created_at) VALUES (?,?,?,?,?,NOW())`,
    [animal.insertId, 'Test Med', '10ml', 7, 'Test prescription']
  );
  console.log('✅ Prescription created: ID', prescription.insertId);

  // NOW VERIFY DASHBOARDS
  // Admin Dashboard
  const [adminDash] = await pool.query(`SELECT COALESCE(SUM(total),0) c FROM receipts WHERE MONTH(created_at)=MONTH(CURDATE()) AND deleted_at IS NULL`);
  const [adminExp] = await pool.query(`SELECT COALESCE(SUM(amount),0) c FROM expense_records WHERE MONTH(date)=MONTH(CURDATE()) AND deleted_at IS NULL`);
  console.log(`\n📊 Admin Dashboard:`);
  console.log(`  Income: ${adminDash[0].c}`);
  console.log(`  Expenses: ${adminExp[0].c}`);

  // Animal Dashboard
  const [cattleCount] = await pool.query(
    `SELECT COUNT(*) c FROM animals a JOIN animal_categories ac ON a.animal_category_id = ac.id WHERE LOWER(TRIM(ac.name)) = ? AND a.deleted_at IS NULL AND a.status='active'`,
    ['cattle']
  );
  const [pigCount] = await pool.query(
    `SELECT COUNT(*) c FROM animals a JOIN animal_categories ac ON a.animal_category_id = ac.id WHERE LOWER(TRIM(ac.name)) = ? AND a.deleted_at IS NULL AND a.status='active'`,
    ['pig']
  );
  console.log(`  Cattle: ${cattleCount[0].c}, Pigs: ${pigCount[0].c}`);

  // Veterinary Dashboard
  const [openHealth] = await pool.query(`SELECT COUNT(*) c FROM animal_health_records WHERE status='open' OR status='active'`);
  const [treatments] = await pool.query(`SELECT COUNT(*) c FROM treatments WHERE deleted_at IS NULL`);
  const [vaccinations] = await pool.query(`SELECT COUNT(*) c FROM vaccination_records WHERE deleted_at IS NULL`);
  const [prescriptions] = await pool.query(`SELECT COUNT(*) c FROM prescriptions`);
  console.log(`  Open Health: ${openHealth[0].c}, Treatments: ${treatments[0].c}, Vaccinations: ${vaccinations[0].c}, Prescriptions: ${prescriptions[0].c}`);

  // CLEAN UP
  await pool.query('DELETE FROM prescriptions WHERE id=?', [prescription.insertId]);
  await pool.query('DELETE FROM treatments WHERE id=?', [treatment.insertId]);
  await pool.query('DELETE FROM vaccination_records WHERE id=?', [vaccination.insertId]);
  await pool.query('DELETE FROM animal_health_records WHERE id=?', [health.insertId]);
  await pool.query('DELETE FROM expense_records WHERE id=?', [expense.insertId]);
  await pool.query('DELETE FROM income_records WHERE id=?', [income.insertId]);
  await pool.query('DELETE FROM animals WHERE id=?', [pig.insertId]);
  await pool.query('DELETE FROM animals WHERE id=?', [animal.insertId]);
  console.log('\n✅ All test data cleaned up');

  await pool.end();
}
main().catch(console.error);
