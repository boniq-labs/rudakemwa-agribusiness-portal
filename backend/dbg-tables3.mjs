import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',waitForConnections:true});
const tables = ['vaccinations','vet_vaccinations','vaccination_schedule','equipment_maintenance','vehicle_maintenance','animal_health_records','health_records','taxes','tax_records'];
for (const t of tables) {
  try {
    const [r] = await p.query(`SHOW TABLES LIKE '${t}'`);
    if (r.length === 0) console.log(`MISSING: ${t}`);
    else {
      const [c] = await p.query(`DESCRIBE ${t}`);
      console.log(`${t}: ${c.map(x => x.Field).join(', ')}`);
    }
  } catch(e) { console.log(`ERROR ${t}: ${e.message}`); }
}
await p.end();
