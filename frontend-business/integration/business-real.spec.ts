import { test, expect, type Page, type BrowserContext } from "@playwright/test";

// No API interception. Browser -> Vite proxy -> real Express -> real local SQL.
// Only the explicitly selected disposable entrypoint replaces external mail/maps.
const password = "LocalOnlyTesting1!";
async function account(page: Page, name: string, email: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre completo").fill(name);
  await page.getByLabel("Teléfono").fill("1123456789");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(
    page.getByText("Cuenta creada.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ir a iniciar sesión" }).click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}
async function mutate(
  page: Page,
  path: string,
  body: unknown,
  method = "POST",
) {
  return page.evaluate(
    async ({ path, body, method }) => {
      const bootstrap = await fetch("/api/business/auth/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await bootstrap.json();
      const response = await fetch(`/api/business${path}`, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, data: await response.json() };
    },
    { path, body, method },
  );
}
async function read(page: Page, path: string) {
  return page.evaluate(async (path) => {
    const r = await fetch(`/api/business${path}`, { credentials: "include" });
    return { status: r.status, data: await r.json() };
  }, path);
}
test("complete corporate flow with three browser identities and disposable PostgreSQL", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [];
  try {
    const adminContext = await browser.newContext({
      baseURL: "http://localhost:5174",
    });
    contexts.push(adminContext);
    const employeeContext = await browser.newContext({
      baseURL: "http://localhost:5174",
    });
    contexts.push(employeeContext);
    const otherContext = await browser.newContext({
      baseURL: "http://localhost:5174",
    });
    contexts.push(otherContext);
    const admin = await adminContext.newPage(),
      employee = await employeeContext.newPage(),
      other = await otherContext.newPage();
    // Fail if any test attempts an external provider, email or real database URL.
    for (const context of contexts)
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (!["localhost", "127.0.0.1"].includes(url.hostname))
          throw new Error(
            "Unexpected external request during disposable integration test",
          );
        await route.continue();
      });
    await test.step("register administrator and create company", async () => {
      await account(admin, "Admin Prueba", "admin.integration@example.test");
      await expect(
        admin.getByRole("heading", { name: "Tu empresa empieza acá" }),
      ).toBeVisible();
      await admin
        .getByLabel("Nombre de empresa")
        .fill("Empresa Integración Local");
      await admin.getByRole("button", { name: "Registrar empresa" }).click();
      await expect(
        admin.getByRole("heading", { name: "Hola, Admin" }),
      ).toBeVisible();
      await expect(admin.getByText("ENTORNO LOCAL DE PRUEBA")).toBeVisible();
      const context = await read(admin, "/contexto");
      expect(context.data.membresia.rol).toBe("administrador");
    });
    let invitationURL = "";
    await test.step("send an invitation to the local mailbox", async () => {
      await admin
        .getByRole("link", { name: "Empleados", exact: false })
        .click();
      await admin
        .getByLabel("Correo del empleado")
        .fill("employee.integration@example.test");
      await admin.getByRole("button", { name: "Enviar invitación" }).click();
      await expect(
        admin.getByText("Invitación enviada.", { exact: false }),
      ).toBeVisible();
      const mailbox = await adminContext.newPage();
      await mailbox.goto("/__local/mail");
      const link = mailbox
        .getByRole("article")
        .filter({ hasText: "employee.integration@example.test" })
        .getByRole("link", { name: "Aceptar invitación" });
      invitationURL = (await link.getAttribute("href"))!;
      expect(invitationURL).toContain("/invitacion#");
      await mailbox.close();
    });
    await test.step("employee registers, accepts invitation and signs in again", async () => {
      await employee.goto(invitationURL);
      await employee
        .getByRole("link", { name: "Registrate", exact: true })
        .click();
      // Account helper reloads signup but sessionStorage retains the invitation.
      await account(
        employee,
        "Empleado Prueba",
        "employee.integration@example.test",
      );
      await expect(
        employee.getByRole("button", {
          name: "Aceptar y acceder a mi empresa",
        }),
      ).toBeVisible();
      await employee
        .getByRole("button", { name: "Aceptar y acceder a mi empresa" })
        .click();
      await expect(
        employee.getByRole("heading", { name: "Hola, Empleado" }),
      ).toBeVisible();
      expect((await read(employee, "/contexto")).data.membresia.rol).toBe(
        "empleado",
      );
      await employee.getByRole("button", { name: "Cerrar sesión" }).click();
      await employee
        .getByLabel("Correo electrónico")
        .fill("employee.integration@example.test");
      await employee.getByLabel("Contraseña").fill(password);
      await employee.getByRole("button", { name: "Iniciar sesión" }).click();
      await expect(
        employee.getByRole("heading", { name: "Hola, Empleado" }),
      ).toBeVisible();
    });
    await test.step("search, compare three providers, register intention and consult own history", async () => {
      await employee
        .getByRole("link", { name: "Solicitar viaje", exact: false })
        .first()
        .click();
      await employee.getByLabel("Origen", { exact: true }).fill("Obelisco");
      await employee
        .getByRole("button", { name: "Obelisco, Av. 9 de Julio, CABA" })
        .click();
      await employee.getByLabel("Destino", { exact: true }).fill("Plaza");
      await employee
        .getByRole("button", { name: "Plaza de Mayo, CABA" })
        .click();
      await employee
        .getByLabel("Motivo laboral")
        .fill("Reunión de integración local");
      await employee
        .getByRole("button", { name: "Comparar alternativas" })
        .click();
      for (const provider of ["Uber", "Cabify", "DiDi"])
        await expect(
          employee.getByRole("button", { name: `Elegir ${provider}` }),
        ).toBeVisible();
      await employee.getByRole("button", { name: "Elegir Uber" }).click();
      await expect(
        employee.getByRole("heading", {
          name: "Tu intención quedó registrada",
        }),
      ).toBeVisible();
      await expect(
        employee.getByRole("link", { name: "Abrir Uber y continuar" }),
      ).toHaveAttribute("href", /^https:\/\/m\.uber\.com\//);
      // Do not click the external provider link; no reservation is made.
      await employee.getByRole("link", { name: "Ver mi registro" }).click();
      await expect(
        employee.getByRole("cell", {
          name: "Reunión de integración local",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        employee.getByText("Intención registrada", { exact: true }),
      ).toBeVisible();
      expect((await read(employee, "/mis-viajes")).data.total).toBe(1);
    });
    await test.step("dashboard reflects SQL data and employee cannot access it", async () => {
      await admin.getByRole("link", { name: "Dashboard" }).click();
      await expect(
        admin.getByRole("heading", { name: "Movilidad de tu empresa" }),
      ).toBeVisible();
      await expect(
        admin.getByText("employee.integration@example.test").first(),
      ).toBeVisible();
      const stats = await read(admin, "/estadisticas");
      expect(stats.data.cantidad).toBe(1);
      expect(Number(stats.data.totalEstimado)).toBeGreaterThan(0);
      expect((await read(admin, "/mis-viajes")).data.total).toBe(0);
      expect((await read(employee, "/estadisticas")).status).toBe(403);
      await employee.goto("/dashboard");
      await expect(employee).toHaveURL("http://localhost:5174/");
    });
    await test.step("second company cannot access members, invitations or comparisons of the first", async () => {
      await account(other, "Otro Admin", "other.integration@example.test");
      await other.getByLabel("Nombre de empresa").fill("Otra Empresa Local");
      await other.getByRole("button", { name: "Registrar empresa" }).click();
      await expect(
        other.getByRole("heading", { name: "Hola, Otro" }),
      ).toBeVisible();
      expect((await read(other, "/viajes")).data.total).toBe(0);
      const memberships = await read(admin, "/empleados");
      const member = memberships.data.items.find(
        (m: { email: string }) =>
          m.email === "employee.integration@example.test",
      );
      expect(
        (
          await mutate(
            other,
            `/empleados/${member.id}`,
            { rol: "empleado", activo: false },
            "PATCH",
          )
        ).status,
      ).toBe(404);
      const invitations = await read(admin, "/invitaciones");
      expect(
        (
          await mutate(
            other,
            `/invitaciones/${invitations.data.items[0].id}/revocar`,
            {},
          )
        ).status,
      ).toBe(404);
      const quote = await mutate(employee, "/comparaciones", {
        origen: "Obelisco",
        destino: "Plaza",
        origenCoordenadas: [-58.3816, -34.6037],
        destinoCoordenadas: [-58.3731, -34.6083],
      });
      expect(
        (
          await mutate(other, "/viajes", {
            comparacionId: quote.data.id,
            clave: crypto.randomUUID(),
            proveedor: "DiDi",
          })
        ).status,
      ).toBe(404);
    });
    await test.step("revocation removes employee Business access and preserves history", async () => {
      await admin
        .getByRole("link", { name: "Empleados", exact: false })
        .click();
      const row = admin
        .getByRole("row")
        .filter({ hasText: "employee.integration@example.test" })
        .first();
      await row.getByRole("button", { name: "Revocar acceso" }).click();
      await admin.getByRole("button", { name: "Confirmar cambio" }).click();
      await expect(admin.getByText("Acceso actualizado.")).toBeVisible();
      expect((await read(employee, "/mis-viajes")).status).toBe(403);
      expect(
        (
          await mutate(employee, "/comparaciones", {
            origen: "Obelisco",
            destino: "Plaza",
            origenCoordenadas: [-58.3816, -34.6037],
            destinoCoordenadas: [-58.3731, -34.6083],
          })
        ).status,
      ).toBe(403);
      expect((await read(admin, "/viajes")).data.total).toBe(1);
    });
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
