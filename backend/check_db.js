const mysql = require('mysql2/promise');
(async () => {
  const p = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'efms', waitForConnections: true, connectionLimit: 10 });
  const [[{ cnt: t }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL");
  const [[{ cnt: c }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL AND animal_category_id=1");
  const [[{ cnt: g }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL AND animal_category_id=4");
  const [[{ cnt: a }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL AND status='active'");
  const [[{ cnt: f }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL AND gender='female'");
  const [[{ cnt: m }]] = await p.query("SELECT COUNT(*) cnt FROM animals WHERE deleted_at IS NULL AND gender='male'");
  const [[{ cnt: b }]] = await p.query("SELECT COUNT(*) cnt FROM birth_records");
  const [[{ cnt: d }]] = await p.query("SELECT COUNT(*) cnt FROM animal_deaths");
  const [[{ cnt: tb }]] = await p.query("SELECT COUNT(*) cnt FROM tobe_in_hit WHERE deleted_at IS NULL");
  console.log(JSON.stringify({ total: t, cattle: c, pigs: g, active: a, female: f, male: m, births: b, deaths: d, tobe: tb }, null, 2));
  const [r1] = await p.query("SELECT id, tag_number, name, status, animal_category_id FROM animals WHERE deleted_at IS NULL AND animal_category_id=4");
  console.log('Pigs:', JSON.stringify(r1));
  const [r2] = await p.query("SELECT id, tag_number, name, status, animal_category_id FROM animals WHERE deleted_at IS NULL AND animal_category_id=1");
  console.log('Cattle:', JSON.stringify(r2));
  await p.end();
})().catch(e => { console.error(e.message); process.exit(1); });
