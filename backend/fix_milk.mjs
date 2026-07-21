import mysql from 'mysql2/promise';
const p = mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});

// Add missing columns to milk_products
const alters = [
  "ALTER TABLE milk_products ADD COLUMN code VARCHAR(50) NULL AFTER name",
  "ALTER TABLE milk_products ADD COLUMN category VARCHAR(100) NULL AFTER code",
  "ALTER TABLE milk_products ADD COLUMN quantity INT DEFAULT 0 AFTER unit",
  "ALTER TABLE milk_products ADD COLUMN price DECIMAL(12,2) DEFAULT 0.00 AFTER quantity",
];
for (const q of alters) {
  try { await p.query(q); console.log('OK:', q.split(' ').slice(0,5).join(' ')); }
  catch (e) { console.log('SKIP:', e.message); }
}

const [c] = await p.query("DESCRIBE milk_products");
console.log('milk_products:', c.map(x => x.Field).join(', '));

// Check customers table
try {
  const [c2] = await p.query("DESCRIBE customers");
  console.log('customers:', c2.map(x => x.Field).join(', '));
} catch(e) { console.log('customers table NOT FOUND'); }

await p.end();
