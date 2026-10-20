const { test } = require("node:test");
const assert = require("node:assert/strict");
const { providerContinuation } = require("../src/business/providers");
const { limiter } = require("../src/business/security");
const quote = {
  origen: { label: "Origen con & y caracteres", coordinates: [-58.4, -34.6] },
  destino: { label: "Destino", coordinates: [-58.42, -34.61] },
};
test("Uber uses documented HTTPS web format with encoded coordinates, never Guest Rides", () => {
  const continuation = providerContinuation("Uber", quote);
  const url = new URL(continuation.url);
  assert.equal(url.origin, "https://m.uber.com");
  assert.equal(JSON.parse(url.searchParams.get("pickup")).longitude, -58.4);
  assert.equal(JSON.parse(url.searchParams.get("drop[0]")).latitude, -34.61);
  assert.equal(continuation.modo, "web");
});
test("Cabify and DiDi have honest official-site fallbacks without undocumented app protocols", () => {
  for (const provider of ["Cabify", "DiDi"]) {
    const c = providerContinuation(provider, quote);
    assert.equal(c.modo, "telefono");
    assert.ok(c.url.startsWith("https://"));
    assert.match(c.mensaje, /no precarga ni confirma/);
  }
});
test("rate limiter rejects excess requests and separates authenticated identities", () => {
  const guard = limiter({ max: 2 });
  let passed = 0;
  let status = 200;
  const response = {
    set() {},
    status(value) {
      status = value;
      return this;
    },
    json() {},
  };
  for (let i = 0; i < 3; i++)
    guard({ ip: "test", webUser: { idUsuario: 1 } }, response, () => passed++);
  assert.equal(passed, 2);
  assert.equal(status, 429);
  guard({ ip: "test", webUser: { idUsuario: 2 } }, response, () => passed++);
  assert.equal(passed, 3);
});
