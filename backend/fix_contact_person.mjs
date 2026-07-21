import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});
try {
  await p.query("ALTER TABLE suppliers ADD COLUMN contact_person VARCHAR(200) AFTER supplier_name");
  console.log('OK: added contact_person column');
} catch(e) { console.log('ERR:', e.message); }
await p.end();
