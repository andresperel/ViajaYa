import { describe, it, expect } from "vitest";
import { active } from "./auth";
import { initialPeriod, money } from "./ui";
import type { Context } from "./types";
const context = {
  usuario: { idUsuario: 1 },
  empresa: { activa: true },
  membresia: { activo: true, rol: "empleado" },
} as Context;
describe("Business presentation invariants", () => {
  it("requires both active membership and active company", () => {
    expect(active(null)).toBe(false);
    expect(active(context)).toBe(true);
    expect(
      active({ ...context, empresa: { ...context.empresa!, activa: false } }),
    ).toBe(false);
    expect(
      active({
        ...context,
        membresia: { ...context.membresia!, activo: false },
      }),
    ).toBe(false);
  });
  it("formats estimates in ARS and uses a valid initial period", () => {
    expect(money(1234)).toMatch(/1[.,]234/);
    const period = initialPeriod();
    expect(period.desde.endsWith("-01")).toBe(true);
    expect(period.desde <= period.hasta).toBe(true);
  });
});
