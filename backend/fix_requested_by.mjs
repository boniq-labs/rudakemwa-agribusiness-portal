import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});
try {
  // Drop FK first
  await p.query("ALTER TABLE purchase_requests DROP FOREIGN KEY purchase_requests_ibfk_2");
  console.log('OK: dropped FK');
} catch(e) { console.log('Note:', e.message); }
try {
  await p.query("ALTER TABLE purchase_requests MODIFY requested_by VARCHAR(200)");
  console.log('OK: modified requested_by to VARCHAR');
} catch(e) { console.log('ERR:', e.message); }
await p.end();
