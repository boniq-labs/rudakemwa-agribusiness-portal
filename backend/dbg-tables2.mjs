import mysql from 'mysql2/promise';
const pool = mysql.createPool({host:'localhost',user:'root',database:'efms',waitForConnections:true});

const tables = ['purchase_requests','purchase_orders','suppliers','transport_requests','vehicles','drivers','maintenance_records','trips','receipts','expense_records','sales_orders','customers','veterinary_health_records','vet_vaccinations','treatments'];
for (const t of tables) {
  try {
    const [r] = await pool.query(`SHOW TABLES LIKE '${t}'`);
    if (r.length === 0) {
      console.log(`MISSING: ${t}`);
    } else {
      const [c] = await pool.query(`DESCRIBE ${t}`);
      console.log(`${t}: ${c.map(x => x.Field).join(', ')}`);
    }
  } catch(e) {
    console.log(`ERROR ${t}: ${e.message}`);
  }
}
await pool.end();
