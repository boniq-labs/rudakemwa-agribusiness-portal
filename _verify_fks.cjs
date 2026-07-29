import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'efms',
  port: Number(process.env.DB_PORT || 3306),
});

async function main() {
  // 1. Verify FK relationships referencing animals
  console.log('=== FK REFERENCING animals(id) ===');
  const [fkRows] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME,
           REFERENCED_COLUMN_NAME, DELETE_RULE, UPDATE_RULE
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME = 'animals'
      AND TABLE_SCHEMA = (SELECT DATABASE())
      AND CONSTRAINT_NAME != 'PRIMARY'
    ORDER BY TABLE_NAME
  `);
  if (fkRows.length === 0) {
    console.log('(No FK constraints found — tables may use MyISAM or FKs not enforced)');
    // Fallback: show all tables that have animal_id or mother_id or father_id columns
    console.log('\n=== TABLES WITH animal_id / mother_id / father_id columns ===');
    const [colRows] = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = (SELECT DATABASE())
        AND COLUMN_NAME IN ('animal_id','mother_id','father_id','animal_id')
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    console.table(colRows);
  } else {
    console.table(fkRows);
  }

  // 2. Check birth_records for animal_id column
  console.log('\n=== birth_records columns ===');
  const [brCols] = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_NAME = 'birth_records' AND TABLE_SCHEMA = (SELECT DATABASE())
    ORDER BY ORDINAL_POSITION
  `);
  console.table(brCols);

  // 3. Check animals table structure for deleted_at
  console.log('\n=== animals columns ===');
  const [aCols] = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
    FROM information_schema.COLUMNS
    WHERE TABLE_NAME = 'animals' AND TABLE_SCHEMA = (SELECT DATABASE())
    ORDER BY ORDINAL_POSITION
  `);
  console.table(aCols);

  // 4. COUNT PIGS — raw DB
  console.log('\n=== PIG COUNT: RAW SQL ===');
  const [pigCount] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) IN ('pigs','pig')
  `);
  console.log('Total pigs in DB (all statuses):', pigCount[0].cnt);

  const [pigCountActive] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) IN ('pigs','pig') AND a.status = 'active'
  `);
  console.log('Active pigs in DB (status=active):', pigCountActive[0].cnt);

  const [pigCountActiveNotDeleted] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) IN ('pigs','pig')
      AND a.status = 'active'
      AND a.deleted_at IS NULL
  `);
  console.log('Active pigs in DB (status=active AND deleted_at IS NULL):', pigCountActiveNotDeleted[0].cnt);

  // 5. COUNT CATTLE — raw DB
  console.log('\n=== CATTLE COUNT: RAW SQL ===');
  const [cattleCount] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) = 'cattle'
  `);
  console.log('Total cattle in DB (all statuses):', cattleCount[0].cnt);

  const [cattleCountActive] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) = 'cattle' AND a.status = 'active'
  `);
  console.log('Active cattle in DB (status=active):', cattleCount[0].cnt);
  
  const [cattleCountActiveNotDeleted] = await pool.query(`
    SELECT COUNT(*) as cnt FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) = 'cattle'
      AND a.status = 'active'
      AND a.deleted_at IS NULL
  `);
  console.log('Active cattle in DB (status=active AND deleted_at IS NULL):', cattleCountActiveNotDeleted[0].cnt);

  // 6. Sample rows — show first 10 pigs
  console.log('\n=== SAMPLE PIGS (first 10) ===');
  const [pigs] = await pool.query(`
    SELECT a.id, a.tag_number, a.name, a.gender, a.status, a.deleted_at, a.created_at
    FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) IN ('pigs','pig')
    ORDER BY a.created_at DESC LIMIT 10
  `);
  console.table(pigs);

  // 7. Sample rows — show first 10 cattle
  console.log('\n=== SAMPLE CATTLE (first 10) ===');
  const [cattle] = await pool.query(`
    SELECT a.id, a.tag_number, a.name, a.gender, a.status, a.deleted_at, a.created_at
    FROM animals a
    JOIN animal_categories ac ON a.animal_category_id = ac.id
    WHERE LOWER(ac.name) = 'cattle'
    ORDER BY a.created_at DESC LIMIT 10
  `);
  console.table(cattle);

  // 8. Total animals including deleted
  console.log('\n=== TOTAL ANIMALS ===');
  const [totalAll] = await pool.query(`SELECT COUNT(*) as cnt FROM animals`);
  console.log('Total animals in DB:', totalAll[0].cnt);
  const [totalNotDeleted] = await pool.query(`SELECT COUNT(*) as cnt FROM animals WHERE deleted_at IS NULL`);
  console.log('Total non-deleted animals:', totalNotDeleted[0].cnt);

  // 9. Categories
  console.log('\n=== ANIMAL CATEGORIES ===');
  const [cats] = await pool.query(`SELECT * FROM animal_categories`);
  console.table(cats);

  await pool.end();
}

main().catch(console.error);
