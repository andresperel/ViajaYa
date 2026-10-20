import { test, expect, type Page } from "@playwright/test";

// Fixtures exist only in tests. Every network call is intercepted; no backend,
// provider, mail service, credentials or remote database is contacted.
async function fixtures(
  page: Page,
  role: "administrador" | "empleado" = "administrador",
  loggedIn = true,
  hasCompany = true,
) {
  let signedIn = loggedIn;
  const company = {
    id: "company-test",
    nombre: "Empresa de prueba E2E",
    activa: true,
    razonSocial: "",
    identificacionFiscal: "",
    direccion: "",
  };
  const user = {
    idUsuario: 1,
    nombre: "Persona de prueba",
    email: "persona@example.test",
    telefono: 123456789,
  };
  const origin = { label: "Origen de prueba", coordinates: [-58.4, -34.6] };
  const destination = {
    label: "Destino de prueba",
    coordinates: [-58.42, -34.61],
  };
  const quote = {
    id: "00000000-0000-4000-8000-000000000001",
    expira: new Date(Date.now() + 900000).toISOString(),
    origen: origin,
    destino: destination,
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
    motivoViaje: "Reunión de prueba",
    moneda: "ARS",
    fuente: "modelo_orientativo_viajaya",
  };
  await page.route("**/api/business/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/business", "");
    let data: unknown = {};
    let status = 200;
    if (path === "/auth/csrf") data = { csrfToken: "test-csrf" };
    else if (path === "/contexto") {
      if (signedIn)
        data = {
          usuario: user,
          empresa: hasCompany ? company : null,
          membresia: hasCompany
            ? { id: "membership-test", activo: true, rol: role }
            : null,
        };
      else {
        status = 401;
        data = { mensaje: "Iniciá sesión." };
      }
    } else if (path === "/auth/login") {
      signedIn = true;
      data = { usuario: user };
    } else if (path === "/auth/logout") signedIn = false;
    else if (path === "/auth/register") {
      status = 201;
      data = { usuario: user };
    } else if (path === "/empresas") {
      hasCompany = true;
      data = { id: company.id };
      status = 201;
    } else if (path === "/resumen-personal" || path === "/estadisticas")
      data = {
        cantidad: 0,
        totalEstimado: 0,
        moneda: "ARS",
        registrosConMoneda: 0,
        registrosSinMoneda: 0,
        proveedores: [],
        actividad: [],
        diario: [],
      };
    else if (path === "/direcciones/sugerencias")
      data = { sugerencias: [origin, destination] };
    else if (path === "/comparaciones") {
      data = quote;
      status = 201;
    } else if (path === "/viajes" && route.request().method() === "POST") {
      data = {
        id: "intent-test",
        viajeId: 99,
        proveedor: route.request().postDataJSON().proveedor,
        recorrido: quote,
        continuacion: {
          url: "https://m.uber.com/",
          modo: "web",
          mensaje:
            "Continuá en Uber. Revisá recorrido y precio antes de confirmar allí.",
        },
      };
      status = 201;
    } else if (
      path === "/invitaciones" &&
      route.request().method() === "POST"
    ) {
      status = 503;
      data = {
        mensaje:
          "El envío de invitaciones requiere configurar el correo empresarial.",
      };
    } else data = { items: [], total: 0, page: 1, size: 20 };
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
}
test("login validates empty fields and signs in using the existing account", async ({
  page,
}) => {
  await fixtures(page, "administrador", false);
  await page.goto("/login");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("Ingresá tu correo.")).toBeVisible();
  await page.getByLabel("Correo electrónico").fill("persona@example.test");
  await page.getByLabel("Contraseña").fill("CorrectPassword1!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Hola, Persona" }),
  ).toBeVisible();
  await expect(
    page.getByText("El primer recorrido está por venir"),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
});
test("employee cannot enter administrative routes and sees own empty history", async ({
  page,
}) => {
  await fixtures(page, "empleado");
  await page.goto("/dashboard");
  await expect(page).toHaveURL("http://127.0.0.1:5173/");
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  await page
    .getByRole("link", { name: "Mis viajes", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Mis viajes laborales" }),
  ).toBeVisible();
  await expect(page.getByText("Sin registros en este período")).toBeVisible();
});
test("account registration and company onboarding lead to an administrator workspace", async ({
  page,
}) => {
  await fixtures(page, "administrador", false, false);
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill("Persona de prueba");
  await page.getByLabel("Teléfono").fill("1123456789");
  await page.getByLabel("Correo electrónico").fill("persona@example.test");
  await page.getByLabel("Contraseña").fill("CorrectPassword1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(
    page.getByText("Cuenta creada.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ir a iniciar sesión" }).click();
  await page.getByLabel("Correo electrónico").fill("persona@example.test");
  await page.getByLabel("Contraseña").fill("CorrectPassword1!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu empresa empieza acá" }),
  ).toBeVisible();
  await page.getByLabel("Nombre de empresa").fill("Empresa E2E");
  await page.getByRole("button", { name: "Registrar empresa" }).click();
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
});
test("selecting a comparison registers intention without declaring a booking", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/solicitar");
  await page.getByLabel("Origen", { exact: true }).fill("Origen");
  await page.getByRole("button", { name: "Origen de prueba" }).click();
  await page.getByLabel("Destino", { exact: true }).fill("Destino");
  await page.getByRole("button", { name: "Destino de prueba" }).click();
  await page.getByLabel("Motivo laboral").fill("Reunión de prueba");
  await page.getByRole("button", { name: "Comparar alternativas" }).click();
  await expect(
    page.getByText("Estimaciones orientativas de ViajaYa", { exact: false }),
  ).toBeVisible();
  const request = page.waitForRequest(
    (r) => r.url().endsWith("/api/business/viajes") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "Elegir Uber" }).click();
  const payload = (await request).postDataJSON();
  expect(payload.proveedor).toBe("Uber");
  expect(payload.precioEstimado).toBeUndefined();
  expect(payload.empresaId).toBeUndefined();
  await expect(
    page.getByRole("heading", { name: "Tu intención quedó registrada" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir Uber y continuar" }),
  ).toHaveAttribute("href", "https://m.uber.com/");
  await expect(
    page.getByText("INTENCIÓN REGISTRADA · SIN RESERVA CONFIRMADA"),
  ).toBeVisible();
});
test("administrator sees true empty dashboard and mail configuration errors", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/dashboard");
  await expect(
    page.getByText("El dashboard se construye con tu actividad"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Empleados" }).click();
  await page.getByLabel("Correo del empleado").fill("employee@example.test");
  await page.getByRole("button", { name: "Enviar invitación" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "El envío de invitaciones requiere configurar el correo empresarial.",
  );
});
test("invitation fragment is retained locally across login and removed from the address bar", async ({
  page,
}) => {
  await fixtures(page, "empleado", false);
  const token = "a".repeat(43);
  await page.goto(`/invitacion#${token}`);
  await expect(page).toHaveURL("http://127.0.0.1:5173/login");
  await expect(
    page.getByText("Tenés una invitación pendiente.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Correo electrónico").fill("persona@example.test");
  await page.getByLabel("Contraseña").fill("CorrectPassword1!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:5173/invitacion");
  await expect(
    page.getByRole("button", { name: "Aceptar y acceder a mi empresa" }),
  ).toBeVisible();
  const accepting = page.waitForRequest((r) =>
    r.url().endsWith("/invitaciones/aceptar"),
  );
  await page
    .getByRole("button", { name: "Aceptar y acceder a mi empresa" })
    .click();
  expect((await accepting).postDataJSON().token).toBe(token);
  await expect(
    page.getByRole("heading", { name: "Hola, Persona" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("business-invitation")),
  ).toBeNull();
});
test("mobile viewport keeps navigation usable and avoids page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtures(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByRole("link", { name: "Configuración" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("login and signup fit a narrow viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtures(page, "empleado", false);
  for (const url of ["/login", "/registro"]) {
    await page.goto(url);
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
