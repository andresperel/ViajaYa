// Configure only non-secret development defaults. Never replace an existing
// value, generate production credentials, or change Mobile environment files.
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const filename = path.resolve(__dirname, "../.env");
const current = fs.existsSync(filename)
  ? fs.readFileSync(filename, "utf8")
  : "";
const existing = dotenv.parse(current);
if ((process.env.NODE_ENV || existing.NODE_ENV) === "production") {
  console.error(
    "Esta configuración automática es solo para desarrollo. No se modificó el entorno.",
  );
  process.exitCode = 1;
} else {
  const defaults = {
    BUSINESS_WEB_ORIGINS: "http://localhost:5173",
    BUSINESS_WEB_URL: "http://localhost:5173",
    LEGACY_BUSINESS_ADMIN_ENABLED: "false",
  };
  const additions = Object.entries(defaults).filter(
    ([name]) => !(name in existing) && !process.env[name],
  );
  if (additions.length)
    fs.appendFileSync(
      filename,
      `${current && !current.endsWith("\n") ? "\n" : ""}\n# Business Web: configuración local sin secretos\n${additions.map(([name, value]) => `${name}=${value}`).join("\n")}\n`,
    );
  console.log(
    `Configuración local: ${additions.length} valores públicos agregados; ningún valor existente reemplazado.`,
  );
  console.log(
    "Supabase, JWT, correo y mapas siguen requiriendo sus credenciales auténticas; no se generaron sustitutos.",
  );
}
