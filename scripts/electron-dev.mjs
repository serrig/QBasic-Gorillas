import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const electronBin = require('electron');

const DEV_URL = 'http://localhost:3000';

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  let viteProc = null;
  const alreadyRunning = await checkServerReady(DEV_URL);

  if (!alreadyRunning) {
    viteProc = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Wait up to 15s for Vite server
    for (let i = 0; i < 60; i++) {
      if (await checkServerReady(DEV_URL)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const electronProc = spawn(electronBin, [path.resolve('electron/main.cjs')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_URL,
    },
  });

  electronProc.on('close', (code) => {
    if (viteProc) viteProc.kill();
    process.exit(code ?? 0);
  });
}

main();
