import mysql from 'mysql2/promise';
const pool = mysql.createPool({host:'localhost',user:'root',database:'efms',waitForConnections:true});

// Nullify photo for Animal ID 11 (PhotoCow) - fake base64
const [r] = await pool.query("UPDATE animals SET photo = NULL WHERE id = 11");
console.log('Updated animals: affected', r.affectedRows);

// Also check all animals photos for ones that start with data: but are too short to be valid
const [short] = await pool.query(
  "SELECT id, name, LENGTH(photo) as plen FROM animals WHERE photo LIKE 'data:%' AND LENGTH(photo) < 100"
);
console.log('Short data URI photos (animals):', JSON.stringify(short));
for (const s of short) {
  await pool.query("UPDATE animals SET photo = NULL WHERE id = ?", [s.id]);
  console.log(`Nullified animal ${s.id} photo`);
}

const [shortUsers] = await pool.query(
  "SELECT id, username, LENGTH(photo) as plen FROM users WHERE photo LIKE 'data:%' AND LENGTH(photo) < 100"
);
console.log('Short data URI photos (users):', JSON.stringify(shortUsers));
for (const s of shortUsers) {
  await pool.query("UPDATE users SET photo = NULL WHERE id = ?", [s.id]);
  console.log(`Nullified user ${s.id} photo`);
}

await pool.end();
console.log('Done');
