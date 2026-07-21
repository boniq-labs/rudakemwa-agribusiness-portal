import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});
for (const sql of [
  "ALTER TABLE expense_records ADD COLUMN payment_method VARCHAR(50) AFTER amount",
  "ALTER TABLE expense_records ADD COLUMN vendor VARCHAR(200) AFTER payment_method",
  "ALTER TABLE expense_records ADD COLUMN notes TEXT AFTER vendor",
]) {
  try { await p.query(sql); console.log('OK:', sql.substring(0,60)); }
  catch(e) { console.log('Note:', e.message.substring(0,80)); }
}
await p.end();
