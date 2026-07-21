import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  async function showCols(table: string) {
    let [r]: any = await c.query("SHOW COLUMNS FROM " + table);
    console.log(table + ':', r.map((x: any) => x.Field).join(', '));
  }
  await showCols('milk_storage_tanks');
  await showCols('milk_waste');
  await showCols('milk_waste_records');
  await showCols('milk_processing');
  await showCols('milk_storage');
  await c.end();
})();
