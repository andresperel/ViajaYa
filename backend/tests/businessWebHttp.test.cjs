const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const bcrypt = require("bcrypt");
const { createDatabase } = require("./businessWebDatabase.cjs");
process.env.JWT_SECRET =
  "business-http-tests-only-secret-at-least-32-characters";
process.env.BUSINESS_WEB_ORIGINS = "http://localhost:5173";
process.env.NODE_ENV = "test";
delete process.env.LEGACY_BUSINESS_ADMIN_ENABLED;
let database;
let server;
let base;
const queries = [];
const fixtureQuote = {
  origen: { label: "Origen de prueba", coordinates: [-58.4, -34.6] },
  destino: { label: "Destino de prueba", coordinates: [-58.42, -34.61] },
  ruta: { distanciaKm: 2, duracionMin: 12 },
  opciones: [
    {
      empresa: "Uber",
      tipo: "Comfort",
      precio: 1234,
      duracionMin: 12,
      idTipoServicio: 1,
    },
    {
      empresa: "Cabify",
      tipo: "Executive",
      precio: 1500,
      duracionMin: 12,
      idTipoServicio: 3,
    },
    {
      empresa: "DiDi",
      tipo: "Express",
      precio: 1100,
      duracionMin: 12,
      idTipoServicio: 2,
    },
  ],
};
const routesPath = path.resolve(
  __dirname,
  "../src/controllers/routeController.js",
);
require.cache[routesPath] = {
  id: routesPath,
  filename: routesPath,
  loaded: true,
  exports: {
    calcularViaje(req, res) {
      res.json(fixtureQuote);
    },
    buscarSugerencias(req, res) {
      res.json({ sugerencias: [fixtureQuote.origen, fixtureQuote.destino] });
    },
  },
};

// Test-only PostgREST adapter over an in-memory PostgreSQL engine. No env file,
// credentials, Supabase client or production database is ever loaded.
const quoteId = (name) => `"${name.replaceAll('"', '""')}"`;
function from(table) {
  let fields = "*",
    operation = "select",
    data,
    exact = false,
    single = false;
  const filters = [],
    orders = [];
  let range = null;
  const chain = {
    select(value = "*", options = {}) {
      fields = value;
      exact = options.count === "exact";
      return chain;
    },
    eq(key, value) {
      filters.push([key, "=", value]);
      return chain;
    },
    gt(key, value) {
      filters.push([key, ">", value]);
      return chain;
    },
    gte(key, value) {
      filters.push([key, ">=", value]);
      return chain;
    },
    lte(key, value) {
      filters.push([key, "<=", value]);
      return chain;
    },
    order(key, options = {}) {
      orders.push(
        `t.${quoteId(key)} ${options.ascending === false ? "DESC" : "ASC"}`,
      );
      return chain;
    },
    range(start, end) {
      range = [start, end];
      return chain;
    },
    insert(value) {
      operation = "insert";
      data = Array.isArray(value) ? value[0] : value;
      return chain;
    },
    update(value) {
      operation = "update";
      data = value;
      return chain;
    },
    delete() {
      operation = "delete";
      return chain;
    },
    single() {
      single = true;
      return chain;
    },
    maybeSingle() {
      single = true;
      return chain;
    },
    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
  };
  async function execute() {
    queries.push({ table, operation, filters: [...filters] });
    try {
      const values = [];
      const param = (value) => {
        values.push(value);
        return `$${values.length}`;
      };
      let statement;
      if (operation === "insert")
        statement = `INSERT INTO public.${quoteId(table)} (${Object.keys(data).map(quoteId).join(",")}) VALUES (${Object.values(data).map(param).join(",")})`;
      else if (operation === "update")
        statement = `UPDATE public.${quoteId(table)} t SET ${Object.entries(
          data,
        )
          .map(([k, v]) => `${quoteId(k)}=${param(v)}`)
          .join(",")}`;
      else if (operation === "delete")
        statement = `DELETE FROM public.${quoteId(table)} t`;
      else {
        let selected;
        if (fields.includes("EmpresaCorporativa("))
          selected = `t.id,t."empresaId",t.rol,t.activo,(SELECT jsonb_build_object('id',c.id,'nombre',c.nombre,'activa',c.activa,'razonSocial',c."razonSocial",'identificacionFiscal',c."identificacionFiscal",'direccion',c.direccion) FROM public."EmpresaCorporativa" c WHERE c.id=t."empresaId") AS "EmpresaCorporativa"`;
        else if (fields.includes("BusinessRegistro("))
          selected = `t.*,(SELECT jsonb_build_object('nombre',u.nombre,'email',u.email) FROM public."Usuario" u WHERE u."idUsuario"=t."idUsuario") AS "Usuario",(SELECT jsonb_build_object('estado',r.estado,'creada',r.creada,'moneda',r.moneda,'fuente',r.fuente) FROM public."BusinessRegistro" r WHERE r."viajeId"=t."idViaje") AS "BusinessRegistro"`;
        else
          selected =
            fields === "*"
              ? "t.*"
              : fields
                  .split(",")
                  .map((f) => `t.${quoteId(f)}`)
                  .join(",");
        statement = `SELECT ${selected}${exact ? ",count(*) OVER() AS test_count" : ""} FROM public.${quoteId(table)} t`;
      }
      if (filters.length)
        statement += ` WHERE ${filters.map(([key, op, value]) => `t.${quoteId(key)} ${op} ${param(value)}`).join(" AND ")}`;
      if (operation === "select") {
        if (orders.length) statement += ` ORDER BY ${orders.join(",")}`;
        if (range)
          statement += ` LIMIT ${range[1] - range[0] + 1} OFFSET ${range[0]}`;
      } else statement += " RETURNING *";
      const response = await database.query(statement, values);
      const rows = response.rows.map(({ test_count, ...row }) => row);
      return {
        data: single ? rows[0] || null : rows,
        error: null,
        count: exact ? Number(response.rows[0]?.test_count || 0) : undefined,
      };
    } catch (error) {
      return { data: null, error };
    }
  }
  return chain;
}
const dbPath = path.resolve(__dirname, "../src/config/supabase.js");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: {
    from,
    async rpc(name, args) {
      try {
        const result = await database.query(
          "SELECT public.business_web_command($1,$2,$3::jsonb) AS data",
          [args.p_actor, args.p_action, JSON.stringify(args.p_data)],
        );
        return { data: result.rows[0].data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
  },
};
before(async () => {
  database = await createDatabase();
  const password = await bcrypt.hash("CorrectPassword1!", 4);
  for (const [id, email] of [
    [1, "admin-a@example.test"],
    [2, "employee-a@example.test"],
    [3, "admin-b@example.test"],
  ])
    await database.query(
      'INSERT INTO public."Usuario"("idUsuario",nombre,email,telefono,"contraseña") VALUES($1,$2,$3,123456789,$4)',
      [id, `Cuenta ${id}`, email, password],
    );
  const app = require("../src/app");
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (database) await database.close();
});
function client(origin = "http://localhost:5173") {
  const jar = new Map();
  let csrf = "";
  return {
    jar,
    async request(url, method = "GET", body, extra = {}) {
      const response = await fetch(
        `${base}${url.startsWith("/api/") || url.startsWith("/business/") || url === "/social-login" || url === "/login" ? url : `/api/business${url}`}`,
        {
          method,
          headers: {
            Origin: origin,
            Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
            ...(method === "GET"
              ? {}
              : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
            ...extra,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      );
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(";");
        const i = pair.indexOf("=");
        jar.set(pair.slice(0, i), pair.slice(i + 1));
      }
      const data = await response.json();
      if (data.csrfToken) csrf = data.csrfToken;
      return { status: response.status, data, headers: response.headers };
    },
    async login(email) {
      await this.request("/auth/csrf");
      return this.request("/auth/login", "POST", {
        email,
        password: "CorrectPassword1!",
      });
    },
  };
}
test("HTTP sessions, permissions, invitation delivery/acceptance, isolation, logout and legacy auth", async (t) => {
  const a = client(),
    employee = client(),
    b = client();
  await t.test(
    "anonymous, bad origins and missing CSRF are rejected",
    async () => {
      assert.equal((await a.request("/contexto")).status, 401);
      assert.equal(
        (await client("https://evil.example").request("/auth/csrf")).status,
        403,
      );
      assert.equal(
        (
          await a.request("/auth/login", "POST", {
            email: "admin-a@example.test",
            password: "CorrectPassword1!",
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "password login returns cookies without JWT or private fields",
    async () => {
      const login = await a.login("admin-a@example.test");
      assert.equal(login.status, 200);
      assert.ok(a.jar.get("vyb_session"));
      assert.equal(login.data.token, undefined);
      assert.equal(login.data.usuario.contraseña, undefined);
      assert.ok(
        login.headers.getSetCookie().some((c) => c.includes("HttpOnly")),
      );
      assert.equal(
        (await a.request("/contexto")).data.usuario.email,
        "admin-a@example.test",
      );
      const stored = (
        await database.query('SELECT "tokenHash" FROM public."BusinessSesion"')
      ).rows[0];
      assert.notEqual(stored.tokenHash, a.jar.get("vyb_session"));
      assert.equal(
        (await employee.login("employee-a@example.test")).status,
        200,
      );
      assert.equal((await b.login("admin-b@example.test")).status, 200);
    },
  );
  await t.test(
    "company registration is atomic and membership is required",
    async () => {
      assert.equal((await employee.request("/mis-viajes")).status, 403);
      assert.equal(
        (await a.request("/empresas", "POST", { nombre: "Empresa HTTP A" }))
          .status,
        201,
      );
      assert.equal(
        (await b.request("/empresas", "POST", { nombre: "Empresa HTTP B" }))
          .status,
        201,
      );
      assert.equal(
        (await a.request("/empresas", "POST", { nombre: "Duplicada" })).status,
        409,
      );
    },
  );
  await t.test(
    "unconfigured mail fails closed; delivered invitation is recipient-bound and single use",
    async () => {
      const previous = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      assert.equal(
        (
          await a.request("/invitaciones", "POST", {
            email: "employee-a@example.test",
            rol: "empleado",
          })
        ).status,
        503,
      );
      process.env.RESEND_API_KEY = "test-only";
      process.env.BUSINESS_EMAIL_FROM = "test@example.test";
      process.env.BUSINESS_WEB_URL = "http://localhost:5173";
      const realFetch = global.fetch;
      let invitationToken;
      global.fetch = async (url, options) => {
        if (url === "https://api.resend.com/emails") {
          const mail = JSON.parse(options.body);
          invitationToken = mail.text.match(/#([\w-]{43})/)[1];
          return new Response("{}", { status: 200 });
        }
        return realFetch(url, options);
      };
      try {
        const response = await a.request("/invitaciones", "POST", {
          email: "employee-a@example.test",
          rol: "empleado",
        });
        assert.equal(response.status, 201);
        assert.equal(response.data.token, undefined);
        assert.equal(
          (
            await b.request("/invitaciones/aceptar", "POST", {
              token: invitationToken,
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await employee.request("/invitaciones/aceptar", "POST", {
              token: invitationToken,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await employee.request("/invitaciones/aceptar", "POST", {
              token: invitationToken,
            })
          ).status,
          403,
        );
      } finally {
        global.fetch = realFetch;
        if (previous) process.env.RESEND_API_KEY = previous;
        else delete process.env.RESEND_API_KEY;
      }
    },
  );
  await t.test(
    "employees cannot access administrative endpoints, even with forged company/user parameters",
    async () => {
      for (const url of [
        "/empleados",
        "/invitaciones",
        "/viajes",
        "/estadisticas",
      ])
        assert.equal((await employee.request(url)).status, 403);
      assert.equal(
        (await employee.request("/empresa", "PATCH", { nombre: "Ataque" }))
          .status,
        403,
      );
      const list = await employee.request(
        "/mis-viajes?empresaId=forged&idUsuario=1",
      );
      assert.equal(list.status, 200);
      const filters = queries.filter((q) => q.table === "Viaje").at(-1).filters;
      assert.ok(
        filters.some(([key, , value]) => key === "idUsuario" && value === 2),
      );
    },
  );
  await t.test(
    "history is tenant scoped and paginated; malformed filters rejected",
    async () => {
      const own = await a.request("/viajes");
      assert.equal(own.status, 200);
      assert.equal(own.data.total, 0);
      const filters = queries.filter((q) => q.table === "Viaje").at(-1).filters;
      const context = await a.request("/contexto");
      assert.ok(
        filters.some(
          ([key, , value]) =>
            key === "empresaId" && value === context.data.empresa.id,
        ),
      );
      assert.equal((await a.request("/viajes?page=0")).status, 400);
      assert.equal((await a.request("/viajes?size=10000")).status, 400);
      assert.equal(
        (await a.request("/estadisticas?desde=2026-02-30&hasta=2026-03-01"))
          .status,
        400,
      );
    },
  );
  await t.test(
    "comparison and trip endpoints use server values and return honest provider continuation",
    async () => {
      const comparison = await employee.request("/comparaciones", "POST", {
        origen: "Origen",
        destino: "Destino",
        origenCoordenadas: fixtureQuote.origen.coordinates,
        destinoCoordenadas: fixtureQuote.destino.coordinates,
        motivoViaje: "Reunión de prueba",
      });
      assert.equal(comparison.status, 201);
      assert.equal(comparison.data.opciones[0].rating, undefined);
      assert.equal(comparison.data.fuente, "modelo_orientativo_viajaya");
      const id = comparison.data.id;
      const key = require("node:crypto").randomUUID();
      const registered = await employee.request("/viajes", "POST", {
        comparacionId: id,
        clave: key,
        proveedor: "Uber",
        precioEstimado: 0,
        idUsuario: 3,
        empresaId: "forged",
      });
      assert.equal(registered.status, 201);
      assert.match(
        registered.data.continuacion.url,
        /^https:\/\/m\.uber\.com\//,
      );
      assert.equal(
        (
          await employee.request("/viajes", "POST", {
            comparacionId: id,
            clave: key,
            proveedor: "Uber",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await b.request("/viajes", "POST", {
            comparacionId: id,
            clave: require("node:crypto").randomUUID(),
            proveedor: "Uber",
          })
        ).status,
        404,
      );
      const own = await employee.request("/mis-viajes");
      assert.equal(own.data.total, 1);
      assert.equal(Number(own.data.items[0].precioEstimado), 1234);
      assert.equal(
        own.data.items[0].BusinessRegistro.estado,
        "intencion_registrada",
      );
      assert.equal((await a.request("/mis-viajes")).data.total, 0);
      assert.equal((await a.request("/viajes")).data.total, 1);
      assert.equal((await b.request("/viajes")).data.total, 0);
      const stats = await a.request("/estadisticas");
      assert.equal(stats.data.cantidad, 1);
      assert.equal(Number(stats.data.totalEstimado), 1234);
    },
  );
  await t.test(
    "mail failure revokes the invitation and never returns its secret",
    async () => {
      process.env.RESEND_API_KEY = "test-only";
      const realFetch = global.fetch;
      global.fetch = async (url, options) =>
        url === "https://api.resend.com/emails"
          ? new Response("{}", { status: 500 })
          : realFetch(url, options);
      try {
        const response = await a.request("/invitaciones", "POST", {
          email: "delivery-failure@example.test",
          rol: "empleado",
        });
        assert.equal(response.status, 502);
        assert.equal(response.data.token, undefined);
        const row = (
          await database.query(
            'SELECT revocada FROM public."BusinessInvitacion" WHERE email=$1',
            ["delivery-failure@example.test"],
          )
        ).rows[0];
        assert.ok(row.revocada);
      } finally {
        global.fetch = realFetch;
        delete process.env.RESEND_API_KEY;
      }
    },
  );
  await t.test("expired sessions and logout revoke web access", async () => {
    assert.equal(
      (await employee.request("/auth/logout", "POST", {})).status,
      200,
    );
    assert.equal((await employee.request("/contexto")).status, 401);
    await database.exec(
      `UPDATE public."BusinessSesion" SET expira=now()-interval '1 second'`,
    );
    assert.equal((await b.request("/contexto")).status, 401);
  });
  await t.test(
    "legacy global administrator is disabled by default",
    async () => {
      assert.equal(
        (
          await a.request("/business/admin/login", "POST", {
            email: "admin@viajaya.com",
            password: "ViajaYaAdmin2026!",
          })
        ).status,
        403,
      );
    },
  );
  await t.test(
    "Apple cannot impersonate existing accounts and never writes users or trips",
    async () => {
      const before = queries.length;
      const beforeTrips = (
        await database.query('SELECT count(*) AS n FROM public."Viaje"')
      ).rows[0].n;
      for (const body of [
        {
          provider: "apple",
          email: "admin-a@example.test",
          nombre: "Impostor",
        },
        {
          provider: "apple",
          email: "new@example.test",
          identityToken: "unverified-junk",
        },
      ])
        assert.equal(
          (await a.request("/social-login", "POST", body)).status,
          403,
        );
      assert.equal(queries.length, before);
      assert.equal(
        (await database.query('SELECT count(*) AS n FROM public."Viaje"'))
          .rows[0].n,
        beforeTrips,
      );
    },
  );
  await t.test(
    "Mobile password login still issues its original JWT",
    async () => {
      const response = await a.request("/login", "POST", {
        email: "admin-a@example.test",
        password: "CorrectPassword1!",
      });
      assert.equal(response.status, 200);
      const payload = require("jsonwebtoken").verify(
        response.data.token,
        process.env.JWT_SECRET,
        { audience: "viajaya-mobile", issuer: "viajaya-api" },
      );
      assert.equal(payload.sub, "1");
    },
  );
  await t.test(
    "verified Google still issues its original JWT; unverified Google is rejected",
    async () => {
      const realFetch = global.fetch;
      global.fetch = async (url, options) =>
        url === "https://openidconnect.googleapis.com/v1/userinfo"
          ? new Response(
              JSON.stringify({
                email: "admin-a@example.test",
                name: "Admin",
                email_verified:
                  options.headers.Authorization === "Bearer valid-google",
              }),
              { status: 200 },
            )
          : realFetch(url, options);
      try {
        const response = await a.request("/social-login", "POST", {
          provider: "google",
          accessToken: "valid-google",
        });
        assert.equal(response.status, 200);
        assert.ok(response.data.token);
        assert.equal(
          (
            await a.request("/social-login", "POST", {
              provider: "google",
              accessToken: "invalid-google",
            })
          ).status,
          401,
        );
      } finally {
        global.fetch = realFetch;
      }
    },
  );
  await t.test(
    "production cookies are Secure and host-bound; plain HTTP origins fail closed",
    async () => {
      process.env.NODE_ENV = "production";
      try {
        assert.equal((await client().request("/auth/csrf")).status, 503);
        process.env.BUSINESS_WEB_ORIGINS = "https://business.example.test";
        const response = await client("https://business.example.test").request(
          "/auth/csrf",
        );
        assert.equal(response.status, 200);
        assert.ok(
          response.headers
            .getSetCookie()
            .some(
              (c) =>
                c.startsWith("__Host-vyb_csrf=") &&
                c.includes("Secure") &&
                c.includes("HttpOnly") &&
                c.includes("Path=/") &&
                !c.includes("Domain="),
            ),
        );
      } finally {
        process.env.NODE_ENV = "test";
        process.env.BUSINESS_WEB_ORIGINS = "http://localhost:5173";
      }
    },
  );
});
