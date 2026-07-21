const { spawn } = require('child_process');
const http = require('http');

// Kill any existing server on port 5000
const kill = spawn('taskkill', ['/F', '/PID', '']);
// Just start the server
const server = spawn('npx.cmd', ['ts-node', 'src/server.ts'], {
  cwd: 'D:/fast/efms/backend',
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

server.stdout.on('data', (d) => process.stdout.write('[OUT] ' + d));
server.stderr.on('data', (d) => process.stderr.write('[ERR] ' + d));

function waitForServer(retries) {
  if (retries <= 0) { console.log('TIMEOUT'); process.exit(1); }
  http.get('http://localhost:5000/api/health', (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => {
      console.log('Server health:', d);
      console.log('READY');
    });
  }).on('error', () => {
    setTimeout(() => waitForServer(retries - 1), 2000);
  });
}

setTimeout(() => waitForServer(15), 3000);
