// Read-only diagnostics. Never logs values, account data, credentials or URLs.
const path = require("node:path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
  quiet: true,
});
const { createClient } = require("@supabase/supabase-js");
async function check() {
  const keys = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "BUSINESS_WEB_ORIGINS",
    "BUSINESS_WEB_URL",
    "RESEND_API_KEY",
    "BUSINESS_EMAIL_FROM",
    "GOOGLE_MAPS_API_KEY",
    "OPENROUTESERVICE_API_KEY",
  ];
  for (const key of keys)
    console.log(
      `${key}: ${process.env[key] ? "configurado (valor oculto)" : "AUSENTE"}`,
    );
  console.log(
    `JWT_SECRET >= 32 caracteres: ${Boolean(process.env.JWT_SECRET?.length >= 32)}`,
  );
  console.log(
    `Invitaciones reales: ${process.env.RESEND_API_KEY && process.env.BUSINESS_EMAIL_FROM && process.env.BUSINESS_WEB_URL ? "configuración presente; entrega real no probada" : "NO configuradas"}`,
  );
  console.log(
    `Rutas reales: ${process.env.GOOGLE_MAPS_API_KEY || process.env.OPENROUTESERVICE_API_KEY ? "configuración presente; servicio real no probado" : "NO configuradas"}`,
  );
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      "Supabase: NO verificable sin URL y clave de servidor. No se intentó conexión ni DDL.",
    );
    process.exitCode = 2;
    return;
  }
  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) =>
          fetch(url, { ...options, signal: AbortSignal.timeout(12000) }),
      },
    },
  );
  const tables = [
    ["Usuario", "idUsuario"],
    ["Viaje", "idViaje,tipoViaje,motivoViaje,empresaId,canalOrigen"],
    ["EmpresaCorporativa", "id,nombre,activa"],
    ["EmpresaUsuario", "id,usuarioId,empresaId,rol"],
    ["BusinessSesion", "tokenHash,expira"],
    ["BusinessInvitacion", "id"],
    ["BusinessComparacion", "id"],
    ["BusinessRegistro", "id"],
    ["BusinessAuditoria", "id"],
  ];
  for (const [table, columns] of tables) {
    const { error } = await db.from(table).select(columns).limit(0);
    console.log(
      `${table}: ${error ? `NO verificable (${/^[a-z0-9]+$/i.test(error.code || "") ? error.code : "conexión/permisos"})` : "columnas accesibles (sin leer filas)"}`,
    );
    if (error) process.exitCode = 2;
  }
  console.log(
    "Este chequeo REST no acredita restricciones, funciones, triggers ni RLS: ejecutar business_schema_audit.sql en SQL Editor.",
  );
}
check().catch(() => {
  console.error(
    "No se pudo completar el diagnóstico. No se modificaron datos. Revisá conexión y permisos sin compartir secretos.",
  );
  process.exitCode = 2;
});
