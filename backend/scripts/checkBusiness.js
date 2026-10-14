const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  let privileged = key.startsWith('sb_secret_');
  try { privileged ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'service_role'; } catch { /* No es una clave JWT. */ }
  const failures = [];
  if (!privileged) failures.push('Falta SUPABASE_SERVICE_ROLE_KEY: la clave actual es pública.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) failures.push('JWT_SECRET debe tener al menos 32 caracteres.');
  if (!process.env.SUPABASE_URL || !key) throw new Error('Falta configurar Supabase en backend/.env.');
  const db = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const [table, columns] of [
    ['EmpresaCorporativa', 'id,nombre,codigo,creada'],
    ['EmpresaUsuario', 'id,empresaId,email,activo,usuarioId,fechaAcceso'],
    ['Viaje', 'idViaje,tipoViaje,motivoViaje,estado,empresaId'],
  ]) {
    const { error } = await db.from(table).select(columns).limit(0);
    if (error) failures.push(`${table}: estructura pendiente o acceso no disponible (${error.code || 'conexión'}).`);
    else console.log(`${table}: estructura accesible.`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Business listo: configuración de servidor y tablas verificadas.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
