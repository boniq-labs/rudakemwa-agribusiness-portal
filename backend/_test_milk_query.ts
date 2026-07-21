import mysql from 'mysql2/promise';
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'efms' });
  try {
    const [r] = await c.query("SELECT COUNT(*) as total FROM storage_tanks WHERE deleted_at IS NULL");
    console.log('Storage tanks count:', (r as any)[0].total);
  } catch (e: any) { console.log('Query err:', e.message); }
  try {
    const [r] = await c.query("SELECT * FROM milk_storage WHERE deleted_at IS NULL LIMIT 5");
    console.log('Milk storage count:', (r as any).length);
  } catch (e: any) { console.log('Milk storage err:', e.message); }
  try {
    const [r] = await c.query("SELECT * FROM processing_records WHERE deleted_at IS NULL LIMIT 5");
    console.log('Processing records count:', (r as any).length);
  } catch (e: any) { console.log('Processing err:', e.message); }
  try {
    const [r] = await c.query("SELECT * FROM milk_waste WHERE deleted_at IS NULL LIMIT 5");
    console.log('Milk waste count:', (r as any).length);
  } catch (e: any) { console.log('Waste err:', e.message); }
  await c.end();
})();
