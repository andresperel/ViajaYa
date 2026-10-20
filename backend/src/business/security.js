const crypto = require("crypto");

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const random = () => crypto.randomBytes(32).toString("base64url");
const origins = () =>
  (process.env.BUSINESS_WEB_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const production = () => process.env.NODE_ENV === "production";
const cookieName = (name) => `${production() ? "__Host-" : ""}vyb_${name}`;
function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "").split(";").flatMap((part) => {
      const i = part.indexOf("=");
      if (i < 0) return [];
      try {
        return [
          [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1))],
        ];
      } catch {
        return [];
      }
    }),
  );
}
function setCookie(res, name, value, maxAge) {
  res.cookie(cookieName(name), value, {
    httpOnly: true,
    secure: production(),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}
function safeEqual(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length > 256 ||
    b.length > 256
  )
    return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function boundary(req, res, next) {
  res.set({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  if (
    production() &&
    (!process.env.BUSINESS_WEB_ORIGINS ||
      origins().some((origin) => !/^https:\/\//.test(origin)))
  )
    return res
      .status(503)
      .json({
        mensaje: "Business requiere orígenes HTTPS explícitos en producción.",
      });
  const origin = req.get("origin");
  if (origin && !origins().includes(origin))
    return res.status(403).json({ mensaje: "Origen web no permitido." });
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (!origin || !origins().includes(origin))
      return res
        .status(403)
        .json({ mensaje: "Se requiere un origen web permitido." });
    if (!safeEqual(cookies(req)[cookieName("csrf")], req.get("x-csrf-token")))
      return res
        .status(403)
        .json({
          mensaje: "La protección de sesión venció. Recargá la página.",
        });
    if (!req.is("application/json"))
      return res.status(415).json({ mensaje: "Se requiere JSON." });
  }
  next();
}
function csrf(req, res) {
  const current = cookies(req)[cookieName("csrf")];
  const token = /^[A-Za-z0-9_-]{43}$/.test(current || "") ? current : random();
  setCookie(res, "csrf", token, 8 * 60 * 60 * 1000);
  res.json({ csrfToken: token });
}
function limiter({ max = 30, windowMs = 60000 } = {}) {
  const entries = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of entries)
      if (entry.until <= now) entries.delete(key);
    const key = String(req.webUser?.idUsuario || req.ip);
    const entry = entries.get(key) || { count: 0, until: now + windowMs };
    if (entries.size >= 10000 && !entries.has(key))
      return res
        .status(429)
        .json({ mensaje: "Demasiadas solicitudes. Intentá más tarde." });
    entries.set(key, entry);
    entry.count++;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
      return res
        .status(429)
        .json({ mensaje: "Demasiadas solicitudes. Intentá más tarde." });
    }
    next();
  };
}
module.exports = {
  hash,
  random,
  origins,
  cookies,
  cookieName,
  setCookie,
  boundary,
  csrf,
  limiter,
};
