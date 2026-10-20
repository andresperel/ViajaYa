const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const { createDatabase } = require("../tests/businessWebDatabase.cjs");
const { createLocalClient } = require("./postgrestLocal.cjs");

async function start() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Disposable Business mode is forbidden in production.");
  const webOrigin =
    process.env.BUSINESS_LOCAL_WEB_ORIGIN || "http://localhost:5173";
  if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(webOrigin))
    throw new Error("Local web origin must be loopback HTTP.");
  const port = Number(process.env.BUSINESS_LOCAL_PORT || 3000);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("Invalid local port.");
  // Nothing is read from .env, persisted as a secret, or sent to Supabase.
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("base64url");
  process.env.NODE_ENV = "development";
  process.env.BUSINESS_WEB_ORIGINS = webOrigin;
  process.env.BUSINESS_WEB_URL = webOrigin;
  process.env.LEGACY_BUSINESS_ADMIN_ENABLED = "false";
  const db = await createDatabase();
  const inject = (file, exports) => {
    const filename = path.resolve(__dirname, file);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  };
  inject("../src/config/supabase.js", createLocalClient(db));
  const originalRoutes = require("../src/controllers/routeController");
  // Public landmarks used exclusively as local test suggestions. No API key or
  // actual street-routing/availability is implied by this disposable environment.
  const addresses = [
    {
      label: "Obelisco, Av. 9 de Julio, CABA",
      coordinates: [-58.3816, -34.6037],
    },
    { label: "Plaza de Mayo, CABA", coordinates: [-58.3731, -34.6083] },
    { label: "Congreso de la Nación, CABA", coordinates: [-58.3926, -34.6098] },
    { label: "Teatro Colón, CABA", coordinates: [-58.3831, -34.6011] },
  ];
  inject("../src/controllers/routeController.js", {
    buscarSugerencias(req, res) {
      const query = String(req.query.q || "").toLowerCase();
      if (query.length < 3)
        return res
          .status(400)
          .json({ mensaje: "Ingresá al menos 3 caracteres." });
      res.json({
        sugerencias: addresses.filter((a) =>
          a.label.toLowerCase().includes(query),
        ),
        proveedor: "simulacion_local",
      });
    },
    calcularViaje(req, res) {
      const match = (coords) =>
        addresses.find(
          (a) =>
            Array.isArray(coords) &&
            a.coordinates.every((v, i) => v === coords[i]),
        );
      const origen = match(req.body.origenCoordenadas),
        destino = match(req.body.destinoCoordenadas);
      if (!origen || !destino || origen === destino)
        return res
          .status(400)
          .json({
            mensaje: "Elegí dos lugares diferentes de las sugerencias locales.",
          });
      const distanciaKm = 2,
        duracionMin = 10;
      res.json({
        origen,
        destino,
        ruta: {
          distanciaKm,
          duracionMin,
          proveedor: "simulacion_local",
          perfil: "prueba",
        },
        opciones: originalRoutes.crearOpciones({ distanciaKm, duracionMin }),
      });
    },
  });
  const outbox = [];
  inject("../src/business/email.js", {
    configured: () => true,
    async sendInvitation(message) {
      outbox.push({ ...message, created: new Date().toISOString() });
    },
  });
  const app = express();
  app.use((req, res, next) => {
    if (!["localhost", "127.0.0.1"].includes(req.hostname))
      return res
        .status(403)
        .json({ mensaje: "Solo loopback en el entorno desechable." });
    if (req.get("origin") && req.get("origin") !== webOrigin)
      return res.status(403).json({ mensaje: "Origen local no permitido." });
    res.set({
      "X-ViajaYa-Environment": "disposable-local",
      "Cache-Control": "no-store",
    });
    next();
  });
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  app.get("/__local/mail", (req, res) => {
    res.set({
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
    });
    res.type("html").send(
      `<!doctype html><html lang="es"><meta charset="utf-8"><title>Buzón local · ViajaYa Business</title><body style="background:#0f1f3a;color:#e9f0f9;font:16px system-ui;padding:30px;max-width:900px"><h1>Buzón local de pruebas</h1><p>No se envió ningún email real. Esta información desaparece al detener el backend. Usá cuentas exclusivamente de prueba.</p>${
        outbox.length
          ? [...outbox]
              .reverse()
              .map(
                (m) =>
                  `<article style="padding:20px;border:1px solid #456;margin:15px 0"><h2>${escape(m.email)}</h2><p>${escape(m.companyName)}</p><a style="color:#7dd3fc" href="${escape(m.url)}">Aceptar invitación</a></article>`,
              )
              .join("")
          : "<p>Sin invitaciones todavía.</p>"
      }<p><a style="color:#7dd3fc" href="${escape(webOrigin)}">Volver a ViajaYa Business</a></p></body></html>`,
    );
  });
  app.use((req, res, next) => {
    if (req.path === "/social-login" && req.method === "POST") {
      return express.json()(req, res, () => {
        if (String(req.body.provider).toLowerCase() === "apple")
          return res
            .status(403)
            .json({ mensaje: "Apple permanece bloqueado." });
        res
          .status(503)
          .json({
            mensaje: "OAuth externo no está habilitado en la base desechable.",
          });
      });
    }
    if (/^\/(uber|webhooks|oauth|descargar-apk|forgot-password)/.test(req.path))
      return res
        .status(403)
        .json({
          mensaje: "Servicios externos deshabilitados en el entorno local.",
        });
    next();
  });
  app.use(require("../src/app"));
  const server = app.listen(port, "127.0.0.1", () => {
    console.log(`Business LOCAL DESECHABLE: http://127.0.0.1:${port}`);
    console.log(`Web: ${webOrigin} · Buzón: ${webOrigin}/__local/mail`);
    console.log(
      "Base inicialmente vacía. No se carga .env. Rutas simuladas; sin correo, reservas ni acceso remoto.",
    );
  });
  server.on("error", (error) => {
    console.error(
      `No se pudo abrir el servidor local (${error.code || "error"}).`,
    );
    db.close().finally(() => {
      process.exitCode = 1;
    });
  });
  const stop = () =>
    server.close(() => db.close().finally(() => process.exit(0)));
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
start().catch((error) => {
  console.error(`No se pudo iniciar Business local: ${error.message}`);
  process.exitCode = 1;
});
