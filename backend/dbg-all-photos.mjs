import mysql from 'mysql2/promise';
const p = await mysql.createPool({host:'localhost',user:'root',database:'efms',waitForConnections:true});
const [r] = await p.query("SELECT id, name, LENGTH(photo) as plen, LEFT(photo,50) as start FROM animals WHERE photo IS NOT NULL AND photo != ''");
console.log('Animals with photos:', JSON.stringify(r));
const [u] = await p.query("SELECT id, username, LENGTH(photo) as plen, LEFT(photo,50) as start FROM users WHERE photo IS NOT NULL AND photo != ''");
console.log('Users with photos:', JSON.stringify(u));
const [b] = await p.query("SELECT id, LENGTH(photo) as plen, LEFT(photo,50) as start FROM birth_records WHERE photo IS NOT NULL AND photo != '' LIMIT 10");
console.log('Birth records with photos:', JSON.stringify(b));
await p.end();
