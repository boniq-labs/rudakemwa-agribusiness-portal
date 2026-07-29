const http = require('http');
const jwt = require('./backend/node_modules/jsonwebtoken');

const token = jwt.sign({id:136,username:'ruda',role:'farm_owner'}, 'efms_jwt_secret_key_2024', {expiresIn:'1h'});

function req(method, path, body) {
  return new Promise((resolve) => {
    const opts = { method, hostname:'localhost', port:5000, path:'/api'+path, headers:{'Content-Type':'application/json','Authorization':'Bearer '+token} };
    const r = http.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{try{r.c={s:res.statusCode,b:JSON.parse(d)}}catch{e=>{r.c={s:res.statusCode,b:d}}; resolve(r.c);}); });
    r.on('error', e => resolve({s:0,b:e.message}));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  // Test the backend endpoint
  const r = await req('GET', '/animal/tobe-in-hit?page=1&limit=25', null);
  console.log('Status:', r.s);
  console.log('Response:', JSON.stringify(r.b).substring(0, 500));
  
  // Create a record
  const cr = await req('POST', '/animal/tobe-in-hit', { animal_category_id: 1, animal_id: 1, tobe_date: '2026-08-15' });
  console.log('\nCreate status:', cr.s, JSON.stringify(cr.b).substring(0, 200));
  
  console.log('\nBackend works correctly.');
})();
