const { PGlite } = require("@electric-sql/pglite");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

async function createDatabase() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE TABLE public."Usuario" (
      "idUsuario" bigint PRIMARY KEY, nombre text NOT NULL, email text UNIQUE NOT NULL,
      telefono bigint, "contraseña" text NOT NULL DEFAULT '', "fechaRegistro" date DEFAULT current_date
    );
    CREATE TABLE public."Viaje" (
      "idViaje" bigint PRIMARY KEY, "idUsuario" bigint NOT NULL REFERENCES public."Usuario"("idUsuario"),
      "calleOrigen" text, "alturaOrigen" integer, "calleDestino" text, "alturaDestino" integer,
      "precioEstimado" numeric, "tiempoEstimado" numeric, "fechaViaje" date, "idTipoServicio" bigint
    );
    GRANT ALL ON public."Usuario",public."Viaje" TO service_role;
  `);
  for (const migration of [
    "20260828_add_estado_viaje.sql",
    "20261007_add_business_viaje.sql",
    "20261014_business_empresas.sql",
    "20261020_business_web.sql",
  ]) {
    await db.exec(
      await readFile(path.join(__dirname, "../migrations", migration), "utf8"),
    );
  }
  return db;
}
async function rpc(db, actor, action, data = {}) {
  return (
    await db.query(
      "SELECT public.business_web_command($1,$2,$3::jsonb) AS result",
      [actor, action, JSON.stringify(data)],
    )
  ).rows[0].result;
}
module.exports = { createDatabase, rpc };
