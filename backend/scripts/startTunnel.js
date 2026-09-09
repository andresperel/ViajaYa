const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const localBinary = path.resolve(__dirname, '../../.tools/ngrok/ngrok.exe');
const binary = process.env.NGROK_BIN || (fs.existsSync(localBinary) ? localBinary : 'ngrok');
const url = process.env.NGROK_URL || process.env.NGROK;
const args = ['http', String(process.env.PORT || 3000), '--config', path.resolve(__dirname, '../ngrok.yml')];
if (url) args.push('--url', url);
const tunnel = spawn(binary, args, { stdio: 'inherit', windowsHide: true });
tunnel.on('error', () => {
  console.error('Instala ngrok v3 o configura NGROK_BIN con la ruta al ejecutable.');
  process.exitCode = 1;
});
tunnel.on('exit', code => { process.exitCode = code || 0; });

const timer = setInterval(async () => {
  try {
    const response = await fetch('http://127.0.0.1:4041/api/tunnels');
    const { tunnels } = await response.json();
    const active = tunnels.find(t => t.public_url.startsWith('https://') &&
      new URL(t.config.addr).port === String(process.env.PORT || 3000));
    if (!active) return;
    const envPath = path.resolve(__dirname, '../../frontend/.env');
    const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const setting = `EXPO_PUBLIC_API_URL=${active.public_url}`;
    fs.writeFileSync(envPath, /^EXPO_PUBLIC_API_URL=.*$/m.test(current)
      ? current.replace(/^EXPO_PUBLIC_API_URL=.*$/m, setting)
      : `${current}\n${setting}\n`);
    console.log('API conectada. Recarga Expo; si cambio la URL, reinicialo con --clear.');
    clearInterval(timer);
  } catch { /* Esperar a que ngrok abra su API local. */ }
}, 1000);
tunnel.on('exit', () => clearInterval(timer));
tunnel.on('error', () => clearInterval(timer));
