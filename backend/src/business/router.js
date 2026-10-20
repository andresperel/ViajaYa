const express = require("express");
const db = require("../config/supabase");
const auth = require("../controllers/authController");
const routes = require("../controllers/routeController");
const {
  hash,
  random,
  origins,
  cookies,
  cookieName,
  setCookie,
  boundary,
  csrf,
  limiter,
} = require("./security");
const { providerContinuation } = require("./providers");
const mail = require("./email");
const router = express.Router();
const USER_FIELDS = "idUsuario,nombre,email,telefono,fechaRegistro";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function result(response) {
  if (response.error) throw response.error;
  return response.data;
}
const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    const status =
      error.status ||
      { 42501: 403, 23505: 409, 22023: 400, P0002: 404, P0001: 409 }[
        error.code
      ] ||
      503;
    if (!error.status)
      console.error("Business Web:", error.code || error.name || "error");
    res.status(status).json({
      mensaje: error.status
        ? error.message
        : status === 503
          ? "Business no está disponible. Revisá la configuración y las migraciones aprobadas."
          : status === 403
            ? "No tenés permiso o tu acceso empresarial ya no está activo."
            : status === 409
              ? "La operación entra en conflicto con el estado actual. Puede ser un duplicado o el último administrador."
              : status === 404
                ? "El recurso no existe o no está disponible."
                : "Los datos no son válidos.",
    });
  }
};
function text(value, min, max, name) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    Array.from(value.trim()).length > max
  )
    throw new HttpError(
      400,
      `${name}: ingresá entre ${min} y ${max} caracteres.`,
    );
  return value.trim();
}
function uuid(value) {
  if (!UUID.test(value || ""))
    throw new HttpError(400, "Identificador inválido.");
  return value;
}
function role(value) {
  if (!["administrador", "empleado"].includes(value))
    throw new HttpError(400, "Rol inválido.");
  return value;
}
function pagination(req) {
  const page = Number(req.query.page || 1);
  const size = Number(req.query.size || 20);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isInteger(size) ||
    size < 1 ||
    size > 100
  )
    throw new HttpError(400, "Paginación inválida.");
  return { page, size, from: (page - 1) * size, to: page * size - 1 };
}
function period(req) {
  const desde =
    req.query.desde ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const hasta = req.query.hasta || new Date().toISOString().slice(0, 10);
  for (const value of [desde, hasta])
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value
    )
      throw new HttpError(400, "Período inválido.");
  if (desde > hasta || Date.parse(hasta) - Date.parse(desde) > 366 * 86400000)
    throw new HttpError(400, "Elegí un período de hasta un año.");
  return { desde, hasta };
}
async function command(req, action, data = {}) {
  return result(
    await db.rpc("business_web_command", {
      p_actor: req.webUser.idUsuario,
      p_action: action,
      p_data: data,
    }),
  );
}
const authenticated = wrap(async (req, res, next) => {
  const token = cookies(req)[cookieName("session")];
  if (!token || token.length !== 43)
    throw new HttpError(401, "Iniciá sesión en ViajaYa Business.");
  const session = result(
    await db
      .from("BusinessSesion")
      .select("usuarioId,expira")
      .eq("tokenHash", hash(token))
      .gt("expira", new Date().toISOString())
      .maybeSingle(),
  );
  if (!session)
    throw new HttpError(401, "Tu sesión venció. Iniciá sesión nuevamente.");
  const user = result(
    await db
      .from("Usuario")
      .select(USER_FIELDS)
      .eq("idUsuario", session.usuarioId)
      .maybeSingle(),
  );
  if (!user) throw new HttpError(401, "La cuenta ya no está disponible.");
  req.webUser = user;
  req.sessionHash = hash(token);
  next();
});
const member = wrap(async (req, res, next) => {
  const membership = result(
    await db
      .from("EmpresaUsuario")
      .select(
        "id,empresaId,rol,activo,EmpresaCorporativa(id,nombre,activa,razonSocial,identificacionFiscal,direccion)",
      )
      .eq("usuarioId", req.webUser.idUsuario)
      .eq("activo", true)
      .maybeSingle(),
  );
  if (!membership || !membership.EmpresaCorporativa?.activa)
    throw new HttpError(403, "Necesitás acceso activo a una empresa.");
  req.membership = membership;
  next();
});
function administrator(req, res, next) {
  if (req.membership.rol !== "administrador")
    return res.status(403).json({
      mensaje: "Esta acción requiere un administrador de tu empresa.",
    });
  next();
}
// Reuse existing account validation/hashing without returning a Mobile JWT to the browser.
async function existingController(controller, body) {
  let status = 200;
  let payload;
  await controller(
    { body },
    {
      status(value) {
        status = value;
        return this;
      },
      json(value) {
        payload = value;
        return this;
      },
    },
  );
  if (status >= 400)
    throw new HttpError(
      status,
      payload?.mensaje || "No se pudo completar la autenticación.",
    );
  return payload;
}
router.use(boundary);
router.get("/auth/csrf", csrf);
router.post(
  "/auth/register",
  limiter({ max: 8 }),
  wrap(async (req, res) => {
    if (typeof req.body.password !== "string" || req.body.password.length < 8)
      throw new HttpError(
        400,
        "La contraseña debe tener al menos 8 caracteres.",
      );
    const data = await existingController(auth.register, req.body);
    res.status(201).json({
      usuario: data.usuario,
      mensaje: "Cuenta creada. Ya podés iniciar sesión.",
    });
  }),
);
router.post(
  "/auth/login",
  limiter({ max: 10 }),
  wrap(async (req, res) => {
    const data = await existingController(auth.login, req.body);
    const token = random();
    const expira = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    result(
      await db.from("BusinessSesion").insert({
        tokenHash: hash(token),
        usuarioId: data.usuario.idUsuario,
        expira,
      }),
    );
    const previous = cookies(req)[cookieName("session")];
    if (previous)
      result(
        await db
          .from("BusinessSesion")
          .delete()
          .eq("tokenHash", hash(previous)),
      );
    setCookie(res, "session", token, 8 * 60 * 60 * 1000);
    res.json({ usuario: data.usuario });
  }),
);
router.use(authenticated);
router.post(
  "/auth/logout",
  wrap(async (req, res) => {
    result(
      await db.from("BusinessSesion").delete().eq("tokenHash", req.sessionHash),
    );
    setCookie(res, "session", "", 0);
    setCookie(res, "csrf", "", 0);
    res.json({ mensaje: "Sesión cerrada." });
  }),
);
router.get(
  "/contexto",
  wrap(async (req, res) => {
    const membership = result(
      await db
        .from("EmpresaUsuario")
        .select(
          "id,empresaId,rol,activo,EmpresaCorporativa(id,nombre,activa,razonSocial,identificacionFiscal,direccion)",
        )
        .eq("usuarioId", req.webUser.idUsuario)
        .maybeSingle(),
    );
    res.json({
      usuario: req.webUser,
      membresia: membership
        ? { id: membership.id, rol: membership.rol, activo: membership.activo }
        : null,
      empresa: membership?.EmpresaCorporativa || null,
    });
  }),
);
router.post(
  "/empresas",
  limiter({ max: 5 }),
  wrap(async (req, res) => {
    res.status(201).json(
      await command(req, "crear_empresa", {
        nombre: text(req.body.nombre, 2, 100, "Nombre"),
        razonSocial: text(req.body.razonSocial || "", 0, 150, "Razón social"),
        identificacionFiscal: text(
          req.body.identificacionFiscal || "",
          0,
          30,
          "Identificación fiscal",
        ),
        direccion: text(req.body.direccion || "", 0, 200, "Dirección"),
      }),
    );
  }),
);
router.post(
  "/invitaciones/aceptar",
  limiter({ max: 10 }),
  wrap(async (req, res) => {
    const token = text(req.body.token, 43, 43, "Invitación");
    res.json(
      await command(req, "aceptar_invitacion", { tokenHash: hash(token) }),
    );
  }),
);
router.use(member);
router.patch(
  "/empresa",
  administrator,
  wrap(async (req, res) => {
    res.json(
      await command(req, "actualizar_empresa", {
        nombre: text(req.body.nombre, 2, 100, "Nombre"),
        razonSocial: text(req.body.razonSocial || "", 0, 150, "Razón social"),
        identificacionFiscal: text(
          req.body.identificacionFiscal || "",
          0,
          30,
          "Identificación fiscal",
        ),
        direccion: text(req.body.direccion || "", 0, 200, "Dirección"),
      }),
    );
  }),
);
router.get(
  "/empleados",
  administrator,
  wrap(async (req, res) => {
    const p = pagination(req);
    const response = await db
      .from("EmpresaUsuario")
      .select("id,email,rol,activo,usuarioId,fechaAcceso", { count: "exact" })
      .eq("empresaId", req.membership.empresaId)
      .order("email")
      .range(p.from, p.to);
    res.json({
      items: result(response),
      total: response.count,
      page: p.page,
      size: p.size,
    });
  }),
);
router.patch(
  "/empleados/:id",
  administrator,
  wrap(async (req, res) => {
    if (typeof req.body.activo !== "boolean")
      throw new HttpError(400, "Indicá si el acceso está activo.");
    res.json(
      await command(req, "actualizar_miembro", {
        id: uuid(req.params.id),
        activo: req.body.activo,
        rol: role(req.body.rol),
      }),
    );
  }),
);
router.get(
  "/invitaciones",
  administrator,
  wrap(async (req, res) => {
    const p = pagination(req);
    const response = await db
      .from("BusinessInvitacion")
      .select("id,email,rol,creada,expira,aceptada,revocada,enviada", {
        count: "exact",
      })
      .eq("empresaId", req.membership.empresaId)
      .order("creada", { ascending: false })
      .range(p.from, p.to);
    res.json({
      items: result(response),
      total: response.count,
      page: p.page,
      size: p.size,
    });
  }),
);
router.post(
  "/invitaciones",
  administrator,
  limiter({ max: 10 }),
  wrap(async (req, res) => {
    if (!mail.configured())
      throw new HttpError(
        503,
        "El envío de invitaciones requiere configurar el correo empresarial.",
      );
    const email = text(req.body.email, 3, 100, "Email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpError(400, "Email inválido.");
    const base = new URL(process.env.BUSINESS_WEB_URL);
    if (
      !origins().includes(base.origin) ||
      (process.env.NODE_ENV === "production" && base.protocol !== "https:")
    )
      throw new HttpError(
        503,
        "La URL empresarial no está configurada correctamente.",
      );
    const token = random();
    const invitation = await command(req, "crear_invitacion", {
      email,
      rol: role(req.body.rol || "empleado"),
      tokenHash: hash(token),
    });
    const url = new URL("/invitacion", base);
    url.hash = token;
    try {
      await mail.sendInvitation({
        email,
        companyName: req.membership.EmpresaCorporativa.nombre,
        url: url.toString(),
        id: invitation.id,
      });
    } catch {
      // A failure must never produce an apparently delivered, usable invitation.
      result(
        await db
          .from("BusinessInvitacion")
          .update({ revocada: new Date().toISOString() })
          .eq("id", invitation.id)
          .eq("empresaId", req.membership.empresaId),
      );
      throw new HttpError(
        502,
        "No se pudo enviar la invitación. Fue revocada; intentá nuevamente.",
      );
    }
    result(
      await db
        .from("BusinessInvitacion")
        .update({ enviada: new Date().toISOString() })
        .eq("id", invitation.id)
        .eq("empresaId", req.membership.empresaId),
    );
    res.status(201).json({ id: invitation.id, mensaje: "Invitación enviada." });
  }),
);
router.post(
  "/invitaciones/:id/revocar",
  administrator,
  wrap(async (req, res) =>
    res.json(
      await command(req, "revocar_invitacion", { id: uuid(req.params.id) }),
    ),
  ),
);
router.get(
  "/direcciones/sugerencias",
  limiter({ max: 60 }),
  routes.buscarSugerencias,
);
router.post(
  "/comparaciones",
  limiter({ max: 20 }),
  wrap(async (req, res) => {
    for (const coordinates of [
      req.body.origenCoordenadas,
      req.body.destinoCoordenadas,
    ]) {
      if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -58.7 ||
        coordinates[0] > -58.25 ||
        coordinates[1] < -34.85 ||
        coordinates[1] > -34.45
      )
        throw new HttpError(
          400,
          "Elegí direcciones válidas desde las sugerencias de CABA.",
        );
    }
    if (req.body.motivoViaje != null)
      text(req.body.motivoViaje, 0, 200, "Motivo");
    let status = 200;
    let quote;
    await routes.calcularViaje(req, {
      status(code) {
        status = code;
        return this;
      },
      json(value) {
        quote = value;
        return this;
      },
    });
    if (status !== 200) return res.status(status).json(quote);
    if (
      ![quote.origen, quote.destino].every(
        (x) =>
          Array.isArray(x?.coordinates) &&
          x.coordinates.length === 2 &&
          x.coordinates.every(Number.isFinite),
      )
    )
      throw new HttpError(
        502,
        "No se pudieron resolver las direcciones. Elegí sugerencias válidas.",
      );
    const snapshot = {
      origen: quote.origen,
      destino: quote.destino,
      ruta: quote.ruta,
      opciones: quote.opciones.map((o) => ({
        empresa: o.empresa,
        tipo: o.tipo,
        precio: o.precio,
        duracionMin: quote.ruta.duracionMin,
        idTipoServicio: o.idTipoServicio,
      })),
      motivoViaje: (req.body.motivoViaje || "").trim() || null,
      moneda: "ARS",
      fuente: "modelo_orientativo_viajaya",
    };
    const saved = await command(req, "crear_comparacion", { datos: snapshot });
    res.status(201).json({ ...saved, ...snapshot });
  }),
);
router.post(
  "/viajes",
  wrap(async (req, res) => {
    const comparisonId = uuid(req.body.comparacionId);
    const key = uuid(req.body.clave);
    const proveedor = text(req.body.proveedor, 3, 20, "Proveedor");
    if (!["Uber", "Cabify", "DiDi"].includes(proveedor))
      throw new HttpError(400, "Proveedor inválido.");
    const saved = await command(req, "registrar_viaje", {
      comparacionId: comparisonId,
      clave: key,
      proveedor,
    });
    res.status(saved.repetido ? 200 : 201).json({
      ...saved,
      continuacion: providerContinuation(saved.proveedor, saved.recorrido),
    });
  }),
);
async function listTrips(req, res, own) {
  const p = pagination(req);
  const dates = period(req);
  let query = db
    .from("Viaje")
    .select(
      "idViaje,idUsuario,calleOrigen,calleDestino,precioEstimado,tiempoEstimado,fechaViaje,motivoViaje,estado,proveedor,canalOrigen,Usuario(nombre,email),BusinessRegistro(estado,creada,moneda,fuente)",
      { count: "exact" },
    )
    .eq("empresaId", req.membership.empresaId)
    .eq("tipoViaje", "business")
    .gte("fechaViaje", dates.desde)
    .lte("fechaViaje", dates.hasta);
  if (own) query = query.eq("idUsuario", req.webUser.idUsuario);
  const response = await query
    .order("fechaViaje", { ascending: false })
    .order("idViaje", { ascending: false })
    .range(p.from, p.to);
  res.json({
    items: result(response),
    total: response.count,
    page: p.page,
    size: p.size,
  });
}
router.get(
  "/mis-viajes",
  wrap((req, res) => listTrips(req, res, true)),
);
router.get(
  "/viajes",
  administrator,
  wrap((req, res) => listTrips(req, res, false)),
);
router.get(
  "/resumen-personal",
  wrap(async (req, res) =>
    res.json(await command(req, "resumen_personal", period(req))),
  ),
);
router.get(
  "/estadisticas",
  administrator,
  wrap(async (req, res) =>
    res.json(await command(req, "estadisticas", period(req))),
  ),
);
module.exports = router;
