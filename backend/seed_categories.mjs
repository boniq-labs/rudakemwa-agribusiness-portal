import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});
const cats = ['Raw Materials','Equipment','Services','Office Supplies','Other'];
for (const c of cats) {
  try {
    await p.query("INSERT INTO supplier_categories (name, description) VALUES (?,?) ON DUPLICATE KEY UPDATE id=id", [c, c]);
    console.log('OK:', c);
  } catch(e) { console.log('ERR:', c, e.message); }
}
const [rows] = await p.query("SELECT * FROM supplier_categories");
console.log('Categories:', JSON.stringify(rows));
await p.end();
