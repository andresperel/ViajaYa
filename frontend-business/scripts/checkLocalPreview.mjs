import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto("http://localhost:5173");
  await page.getByRole("heading", { name: "Bienvenido de nuevo" }).waitFor();
  await page.getByText("ENTORNO LOCAL DE PRUEBA").waitFor();
  const csrf = await page.request.get(
    "http://localhost:5173/api/business/auth/csrf",
  );
  if (
    csrf.status() !== 200 ||
    csrf.headers()["x-viajaya-environment"] !== "disposable-local"
  )
    throw new Error("Unexpected preview environment");
  await page.screenshot({
    path: "test-results/local-login-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    !(await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ))
  )
    throw new Error("Horizontal overflow");
  await page.screenshot({
    path: "test-results/local-login-mobile.png",
    fullPage: true,
  });
  if (errors.length) throw new Error("Browser runtime error");
  console.log(
    `Vista local: HTTP ${response.status()}, login visible, aviso de base desechable, proxy/CSRF y responsive OK. No se crearon cuentas ni viajes.`,
  );
} finally {
  await browser.close();
}
