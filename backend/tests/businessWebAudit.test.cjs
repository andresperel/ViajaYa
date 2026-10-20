const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createDatabase } = require("./businessWebDatabase.cjs");
test("read-only schema audit verifies complete local schema and never returns account rows", async () => {
  const db = await createDatabase();
  try {
    const sql = await fs.readFile(
      path.resolve(__dirname, "../sql/business_schema_audit.sql"),
      "utf8",
    );
    const results = await db.exec(sql);
    const report = results
      .flatMap((r) => r.rows)
      .find((r) => r.diagnostico_business).diagnostico_business;
    assert.ok(report.estado_columnas.every((s) => s.presentes === s.esperadas));
    assert.equal(report.faltantes.length, 0);
    assert.equal(report.triggers.length, 1);
    assert.equal(report.funciones.length, 2);
    assert.ok(
      report.tablas
        .filter((t) => t.tabla.startsWith("Business"))
        .every((t) => t.rls),
    );
    assert.equal(report.riesgos_preflight.viaje_id_bigint, true);
  } finally {
    await db.close();
  }
});
test("migration guard refuses reapplication before DDL and preserves existing data", async () => {
  const db = await createDatabase();
  try {
    await db.exec(
      `INSERT INTO public."Usuario"("idUsuario",nombre,email) VALUES(9,'Persona de prueba','guard@example.test'); INSERT INTO public."Viaje"("idViaje","idUsuario") VALUES(9,9)`,
    );
    const sql = await fs.readFile(
      path.resolve(__dirname, "../migrations/20261020_business_web.sql"),
      "utf8",
    );
    await assert.rejects(db.exec(sql), /Business Web ya está aplicado/);
    await db.exec("ROLLBACK");
    assert.equal(
      (await db.query('SELECT count(*) AS n FROM public."Viaje"')).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
