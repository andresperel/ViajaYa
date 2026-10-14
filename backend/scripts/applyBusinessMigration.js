const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath, quiet: true });

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Falta SUPABASE_ACCESS_TOKEN en backend/.env para aplicar la migración. La clave pública y la service role no permiten ejecutar DDL.');
  const url = new URL(process.env.SUPABASE_URL);
  if (!/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.protocol !== 'https:') throw new Error('SUPABASE_URL debe identificar el proyecto remoto de Supabase.');
  const ref = url.hostname.split('.')[0];
  async function management(suffix, options = {}) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/${suffix}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`Supabase rechazó ${suffix.split('?')[0]} (HTTP ${response.status}). Verificá los permisos del token administrativo.`);
    return response.json();
  }
  let serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverKey) {
    const keys = await management('api-keys?reveal=true');
    const privileged = keys.find(k => k.name === 'service_role' || k.type === 'secret');
    if (!privileged?.api_key) throw new Error('No se encontró una clave de servidor. Configurá SUPABASE_SERVICE_ROLE_KEY en backend/.env.');
    serverKey = privileged.api_key;
  }
  const db = createClient(url.origin, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const prerequisites = await db.from('Viaje').select('tipoViaje,motivoViaje,estado').limit(0);
  if (prerequisites.error) throw new Error('Faltan las migraciones previas de clasificación o estados, o la clave de servidor no es válida.');
  const query = fs.readFileSync(path.resolve(__dirname, '../migrations/20261014_business_empresas.sql'), 'utf8');
  await management('database/query', { method: 'POST', body: JSON.stringify({ query, read_only: false }) });
  // Guardar la clave únicamente en el archivo ignorado de backend, sin imprimirla.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const setting = `SUPABASE_SERVICE_ROLE_KEY=${serverKey}`;
    fs.writeFileSync(envPath, /^SUPABASE_SERVICE_ROLE_KEY=.*$/m.test(current)
      ? current.replace(/^SUPABASE_SERVICE_ROLE_KEY=.*$/m, () => setting)
      : `${current.trimEnd()}\n${setting}\n`);
  }
  console.log('Migración Business aplicada y clave de servidor configurada en backend/.env.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
