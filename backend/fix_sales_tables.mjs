import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',connectionLimit:1});
const tables = ['sales_invoices','sales_invoice_items','customer_payments'];
for (const t of tables) {
  try { const [r] = await p.query(`SELECT COUNT(*) as c FROM ${t}`); console.log(`${t}: exists (${r[0].c} rows)`); }
  catch(e) { console.log(`${t}: ${e.message.substring(0,60)}`); }
}
await p.end();
