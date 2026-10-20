const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, createHash } = require("node:crypto");
const { createDatabase, rpc } = require("./businessWebDatabase.cjs");
let db;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const snapshot = {
  origen: { label: "Origen real seleccionado", coordinates: [-58.4, -34.6] },
  destino: {
    label: "Destino real seleccionado",
    coordinates: [-58.42, -34.61],
  },
  motivoViaje: "Reunión",
  opciones: [
    { empresa: "Uber", precio: 1234, duracionMin: 12, idTipoServicio: 1 },
    { empresa: "Cabify", precio: 1500, duracionMin: 12, idTipoServicio: 3 },
    { empresa: "DiDi", precio: 1100, duracionMin: 12, idTipoServicio: 2 },
  ],
};
before(async () => {
  db = await createDatabase();
});
after(async () => {
  if (db) await db.close();
});
beforeEach(async () => {
  await db.exec('TRUNCATE public."Usuario" CASCADE');
  await db.exec(
    `INSERT INTO public."Usuario"("idUsuario",nombre,email) VALUES(1,'Admin A','a@example.test'),(2,'Empleado A','e@example.test'),(3,'Admin B','b@example.test'),(4,'Otro','o@example.test')`,
  );
});
async function companies() {
  const a = await rpc(db, 1, "crear_empresa", { nombre: "Empresa A" });
  const b = await rpc(db, 3, "crear_empresa", { nombre: "Empresa B" });
  return { a: a.id, b: b.id };
}
async function invite(actor = 1, email = "e@example.test", role = "empleado") {
  const token = digest(randomUUID());
  const i = await rpc(db, actor, "crear_invitacion", {
    email,
    rol: role,
    tokenHash: token,
  });
  await db.query(
    'UPDATE public."BusinessInvitacion" SET enviada=now() WHERE id=$1',
    [i.id],
  );
  return { ...i, tokenHash: token };
}
test("migrations run in real local PostgreSQL; creator is administrator atomically", async () => {
  const company = await rpc(db, 1, "crear_empresa", { nombre: "Empresa A" });
  const rows = (
    await db.query('SELECT * FROM public."EmpresaUsuario" WHERE "usuarioId"=1')
  ).rows;
  assert.equal(rows[0].empresaId, company.id);
  assert.equal(rows[0].rol, "administrador");
  await assert.rejects(rpc(db, 1, "crear_empresa", { nombre: "Duplicada" }), {
    code: "23505",
  });
  assert.equal(
    (await db.query('SELECT count(*) AS n FROM public."EmpresaCorporativa"'))
      .rows[0].n,
    1,
  );
});
test("acceptance validates recipient, consumes invitation once and preserves role", async () => {
  await companies();
  const invitation = await invite();
  await assert.rejects(
    rpc(db, 4, "aceptar_invitacion", { tokenHash: invitation.tokenHash }),
    { code: "42501" },
  );
  await rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash });
  assert.equal(
    (
      await db.query(
        'SELECT rol FROM public."EmpresaUsuario" WHERE "usuarioId"=2',
      )
    ).rows[0].rol,
    "empleado",
  );
  await assert.rejects(
    rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash }),
    { code: "42501" },
  );
});
test("expired, revoked and not-delivered invitations cannot be accepted", async () => {
  await companies();
  for (const mode of ["expired", "revoked", "not_sent"]) {
    const invitation = await invite();
    if (mode === "expired")
      await db.query(
        `UPDATE public."BusinessInvitacion" SET expira=now()-interval '1 second' WHERE id=$1`,
        [invitation.id],
      );
    if (mode === "revoked")
      await rpc(db, 1, "revocar_invitacion", { id: invitation.id });
    if (mode === "not_sent")
      await db.query(
        'UPDATE public."BusinessInvitacion" SET enviada=NULL WHERE id=$1',
        [invitation.id],
      );
    await assert.rejects(
      rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash }),
      { code: "42501" },
    );
    await db.query(
      'UPDATE public."BusinessInvitacion" SET revocada=now() WHERE id=$1',
      [invitation.id],
    );
  }
});
test("one company per account; invitation does not silently move users", async () => {
  await companies();
  await assert.rejects(invite(1, "b@example.test"), { code: "23505" });
  await assert.rejects(
    rpc(db, 1, "crear_invitacion", {
      email: "e@example.test",
      rol: "superadmin",
      tokenHash: digest("bad"),
    }),
    { code: "22023" },
  );
});
test("employees cannot invite, manage company, view statistics or change roles", async () => {
  await companies();
  const invitation = await invite();
  await rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash });
  for (const action of [
    "crear_invitacion",
    "actualizar_empresa",
    "actualizar_miembro",
    "estadisticas",
    "revocar_invitacion",
  ])
    await assert.rejects(rpc(db, 2, action, {}), { code: "42501" });
});
test("last administrator is protected; role transfer works once another admin exists", async () => {
  await companies();
  const id = (
    await db.query('SELECT id FROM public."EmpresaUsuario" WHERE "usuarioId"=1')
  ).rows[0].id;
  for (const data of [
    { activo: false, rol: "administrador" },
    { activo: true, rol: "empleado" },
  ])
    await assert.rejects(rpc(db, 1, "actualizar_miembro", { id, ...data }), {
      code: "P0001",
    });
  const invitation = await invite(1, "e@example.test", "administrador");
  await rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash });
  await rpc(db, 1, "actualizar_miembro", { id, activo: true, rol: "empleado" });
  assert.equal(
    (
      await db.query(
        'SELECT rol FROM public."EmpresaUsuario" WHERE "usuarioId"=1',
      )
    ).rows[0].rol,
    "empleado",
  );
});
test("unlinked legacy member cannot be promoted as a phantom administrator", async () => {
  const { a } = await companies();
  const row = (
    await db.query(
      'INSERT INTO public."EmpresaUsuario"("empresaId",email) VALUES($1,$2) RETURNING id',
      [a, "pending@example.test"],
    )
  ).rows[0];
  await assert.rejects(
    rpc(db, 1, "actualizar_miembro", {
      id: row.id,
      activo: true,
      rol: "administrador",
    }),
    { code: "22023" },
  );
});
test("tenant A cannot modify members or revoke invitations from tenant B", async () => {
  await companies();
  const member = (
    await db.query('SELECT id FROM public."EmpresaUsuario" WHERE "usuarioId"=3')
  ).rows[0];
  await assert.rejects(
    rpc(db, 1, "actualizar_miembro", {
      id: member.id,
      activo: false,
      rol: "empleado",
    }),
    { code: "P0002" },
  );
  const invitation = await invite(3, "o@example.test");
  await assert.rejects(
    rpc(db, 1, "revocar_invitacion", { id: invitation.id }),
    { code: "P0002" },
  );
});
test("trip registration uses server snapshot; retries cannot duplicate or alter provider/price", async () => {
  const { a } = await companies();
  const comparison = await rpc(db, 1, "crear_comparacion", { datos: snapshot });
  const key = randomUUID();
  const first = await rpc(db, 1, "registrar_viaje", {
    comparacionId: comparison.id,
    clave: key,
    proveedor: "Uber",
    precio: 1,
    empresaId: randomUUID(),
    usuarioId: 3,
  });
  await db.query(
    `UPDATE public."BusinessComparacion" SET expira=now()-interval '1 second' WHERE id=$1`,
    [comparison.id],
  );
  const again = await rpc(db, 1, "registrar_viaje", {
    comparacionId: comparison.id,
    clave: key,
    proveedor: "Uber",
  });
  assert.equal(first.viajeId, again.viajeId);
  assert.equal(again.repetido, true);
  const trip = (await db.query('SELECT * FROM public."Viaje"')).rows[0];
  assert.equal(Number(trip.precioEstimado), 1234);
  assert.equal(trip.empresaId, a);
  assert.equal(trip.idUsuario, 1);
  assert.equal(trip.estado, "pendiente");
  assert.equal(trip.canalOrigen, "business_web");
  await assert.rejects(
    rpc(db, 1, "registrar_viaje", {
      comparacionId: comparison.id,
      clave: key,
      proveedor: "DiDi",
    }),
    { code: "23505" },
  );
  const newKeyRetry = await rpc(db, 1, "registrar_viaje", {
    comparacionId: comparison.id,
    clave: randomUUID(),
    proveedor: "Uber",
  });
  assert.equal(first.viajeId, newKeyRetry.viajeId);
});
test("another account or company cannot register someone else’s comparison", async () => {
  await companies();
  const invitation = await invite();
  await rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash });
  const quote = await rpc(db, 1, "crear_comparacion", { datos: snapshot });
  for (const actor of [2, 3])
    await assert.rejects(
      rpc(db, actor, "registrar_viaje", {
        comparacionId: quote.id,
        clave: randomUUID(),
        proveedor: "Uber",
      }),
      { code: "P0002" },
    );
});
test("idempotency key bound to a different registered comparison always conflicts", async () => {
  await companies();
  const first = await rpc(db, 1, "crear_comparacion", { datos: snapshot });
  const second = await rpc(db, 1, "crear_comparacion", { datos: snapshot });
  const firstKey = randomUUID();
  const secondKey = randomUUID();
  await rpc(db, 1, "registrar_viaje", {
    comparacionId: first.id,
    clave: firstKey,
    proveedor: "Uber",
  });
  await rpc(db, 1, "registrar_viaje", {
    comparacionId: second.id,
    clave: secondKey,
    proveedor: "Uber",
  });
  await assert.rejects(
    rpc(db, 1, "registrar_viaje", {
      comparacionId: second.id,
      clave: firstKey,
      proveedor: "Uber",
    }),
    { code: "23505" },
  );
});
test("revocation and company deactivation block comparison and registration", async () => {
  const { a } = await companies();
  const invitation = await invite();
  await rpc(db, 2, "aceptar_invitacion", { tokenHash: invitation.tokenHash });
  const quote = await rpc(db, 2, "crear_comparacion", { datos: snapshot });
  const id = (
    await db.query('SELECT id FROM public."EmpresaUsuario" WHERE "usuarioId"=2')
  ).rows[0].id;
  await rpc(db, 1, "actualizar_miembro", {
    id,
    activo: false,
    rol: "empleado",
  });
  await assert.rejects(
    rpc(db, 2, "registrar_viaje", {
      comparacionId: quote.id,
      clave: randomUUID(),
      proveedor: "Uber",
    }),
    { code: "42501" },
  );
  await db.query(
    'UPDATE public."EmpresaCorporativa" SET activa=false WHERE id=$1',
    [a],
  );
  await assert.rejects(rpc(db, 1, "crear_comparacion", { datos: snapshot }), {
    code: "42501",
  });
});
test("expired comparison without an existing registration is rejected", async () => {
  await companies();
  const quote = await rpc(db, 1, "crear_comparacion", { datos: snapshot });
  await db.query(
    `UPDATE public."BusinessComparacion" SET expira=now()-interval '1 second' WHERE id=$1`,
    [quote.id],
  );
  await assert.rejects(
    rpc(db, 1, "registrar_viaje", {
      comparacionId: quote.id,
      clave: randomUUID(),
      proveedor: "Uber",
    }),
    { code: "P0002" },
  );
});
test("statistics isolate tenants and personal activity; no fabricated paid totals", async () => {
  await companies();
  for (const actor of [1, 3]) {
    const quote = await rpc(db, actor, "crear_comparacion", {
      datos: snapshot,
    });
    await rpc(db, actor, "registrar_viaje", {
      comparacionId: quote.id,
      clave: randomUUID(),
      proveedor: "Uber",
    });
  }
  const data = await rpc(db, 1, "estadisticas", {
    desde: "2020-01-01",
    hasta: "2020-01-02",
  });
  assert.equal(data.cantidad, 0);
  assert.equal(data.totalEstimado, 0);
  const today = new Date().toISOString().slice(0, 10);
  const actual = await rpc(db, 1, "estadisticas", {
    desde: today,
    hasta: today,
  });
  assert.equal(actual.cantidad, 1);
  assert.equal(Number(actual.totalEstimado), 1234);
  assert.equal(actual.actividad.length, 1);
  assert.equal(actual.actividad[0].email, "a@example.test");
});
test("legacy personal trips remain compatible and are excluded from corporate statistics", async () => {
  await companies();
  await db.exec(
    `INSERT INTO public."Viaje"("idViaje","idUsuario","calleOrigen","calleDestino","precioEstimado","fechaViaje") VALUES(123,1,'Anterior','Destino',50,current_date)`,
  );
  const trip = (
    await db.query('SELECT * FROM public."Viaje" WHERE "idViaje"=123')
  ).rows[0];
  assert.equal(trip.tipoViaje, "personal");
  assert.equal(trip.canalOrigen, "mobile");
  assert.equal(trip.empresaId, null);
  const today = new Date().toISOString().slice(0, 10);
  const stats = await rpc(db, 1, "estadisticas", {
    desde: today,
    hasta: today,
  });
  assert.equal(stats.cantidad, 0);
});
test("anonymous and authenticated database roles cannot execute privileged commands or read session secrets", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    try {
      await assert.rejects(
        rpc(db, 1, "crear_empresa", { nombre: "Intrusión" }),
        { code: "42501" },
      );
      await assert.rejects(db.query('SELECT * FROM public."BusinessSesion"'), {
        code: "42501",
      });
    } finally {
      await db.exec("RESET ROLE");
    }
  }
  await db.exec("SET ROLE service_role");
  try {
    await rpc(db, 1, "crear_empresa", { nombre: "Empresa autorizada" });
  } finally {
    await db.exec("RESET ROLE");
  }
});
