import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../api";
import { useAuth } from "../auth";
import type { Employee, Invitation, Page, Role } from "../types";
import {
  date,
  Empty,
  ErrorBox,
  Loading,
  Notice,
  PageTitle,
  Pager,
  useRemote,
} from "../ui";

export function Employees() {
  const { refresh: refreshContext } = useAuth();
  const [page, setPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const employees = useRemote<Page<Employee>>(`/empleados?page=${page}`);
  const invitations = useRemote<Page<Invitation>>(
    `/invitaciones?page=${invitePage}`,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [pending, setPending] = useState<{
    employee: Employee;
    activo: boolean;
    rol: Role;
  } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; rol: Role }>({
    defaultValues: { rol: "empleado" },
  });
  async function invite(values: { email: string; rol: Role }) {
    setError("");
    setMessage("");
    try {
      await api("/invitaciones", "POST", values);
      reset();
      invitations.refresh();
      setMessage(
        "Invitación enviada. El destinatario debe abrir el enlace e iniciar sesión con ese correo.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function update() {
    if (!pending) return;
    setBusy(pending.employee.id);
    setError("");
    setMessage("");
    try {
      await api(`/empleados/${pending.employee.id}`, "PATCH", {
        activo: pending.activo,
        rol: pending.rol,
      });
      setPending(null);
      employees.refresh();
      await refreshContext();
      setMessage("Acceso actualizado.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function revoke(id: string) {
    setBusy(id);
    setError("");
    try {
      await api(`/invitaciones/${id}/revocar`, "POST", {});
      invitations.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageTitle eyebrow="ADMINISTRACIÓN" title="Tu equipo, conectado" />
      <ErrorBox message={error} />
      {message && <Notice>{message}</Notice>}
      <section className="card">
        <h2>Invitar a una persona</h2>
        <p className="muted">
          Recibirá un enlace personal válido por 72 horas. No tendrá acceso
          hasta que lo acepte.
        </p>
        <form
          onSubmit={handleSubmit(invite)}
          className="invite-form"
          noValidate
        >
          <fieldset disabled={isSubmitting}>
            <label>
              Correo del empleado
              <input
                type="email"
                maxLength={100}
                placeholder="persona@tuempresa.com"
                {...register("email", {
                  required: "Ingresá el correo.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Ingresá un correo válido.",
                  },
                })}
              />
              <small className="field-error">{errors.email?.message}</small>
            </label>
            <label>
              Rol
              <select {...register("rol")}>
                <option value="empleado">Empleado</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
            <button type="submit">
              {isSubmitting ? "Enviando…" : "Enviar invitación ↗"}
            </button>
          </fieldset>
        </form>
      </section>
      {pending && (
        <section
          className="card confirmation"
          role="alertdialog"
          aria-label="Confirmar cambio de acceso"
        >
          <h2>Confirmar cambio de acceso</h2>
          <p>
            {pending.employee.email}:{" "}
            {pending.activo
              ? `acceso activo como ${pending.rol}`
              : "revocar acceso empresarial"}
            . Esta acción cambia sus permisos inmediatamente.
          </p>
          <button disabled={Boolean(busy)} onClick={update}>
            {busy ? "Guardando…" : "Confirmar cambio"}
          </button>
          <button
            className="secondary"
            disabled={Boolean(busy)}
            onClick={() => setPending(null)}
          >
            Cancelar
          </button>
        </section>
      )}
      <section className="card">
        <h2>Miembros de la empresa</h2>
        <p className="muted">
          No se puede revocar ni degradar al último administrador activo.
        </p>
        <ErrorBox message={employees.error} />
        {employees.error && (
          <button onClick={employees.refresh}>Reintentar</button>
        )}
        {employees.loading ? (
          <Loading />
        ) : (
          employees.data &&
          (employees.data.items.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Persona</th>
                      <th>Rol</th>
                      <th>Acceso</th>
                      <th>Administrar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.data.items.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.email}</strong>
                          <small>
                            {e.usuarioId
                              ? "Cuenta vinculada"
                              : "Asociación anterior sin cuenta vinculada"}
                          </small>
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`role-${e.id}`}>
                            Rol de {e.email}
                          </label>
                          <select
                            id={`role-${e.id}`}
                            value={e.rol}
                            disabled={Boolean(busy)}
                            onChange={(event) =>
                              setPending({
                                employee: e,
                                activo: e.activo,
                                rol: event.target.value as Role,
                              })
                            }
                          >
                            <option value="empleado">Empleado</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        </td>
                        <td>
                          <span
                            className={`status ${e.activo ? "" : "inactive"}`}
                          >
                            {e.activo ? "Activo" : "Revocado"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="secondary"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              setPending({
                                employee: e,
                                activo: !e.activo,
                                rol: e.rol,
                              })
                            }
                          >
                            {e.activo ? "Revocar acceso" : "Reactivar acceso"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager
                page={page}
                total={employees.data.total}
                change={setPage}
              />
            </>
          ) : (
            <Empty />
          ))
        )}
      </section>
      <section className="card">
        <h2>Invitaciones</h2>
        <ErrorBox message={invitations.error} />
        {invitations.error && (
          <button onClick={invitations.refresh}>Reintentar</button>
        )}
        {invitations.loading ? (
          <Loading />
        ) : (
          invitations.data &&
          (invitations.data.items.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Destinatario</th>
                      <th>Rol</th>
                      <th>Vencimiento</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.data.items.map((i) => {
                      const state = i.aceptada
                        ? "Aceptada"
                        : i.revocada
                          ? "Revocada"
                          : new Date(i.expira) <= new Date()
                            ? "Vencida"
                            : i.enviada
                              ? "Enviada"
                              : "Pendiente de envío";
                      return (
                        <tr key={i.id}>
                          <td>{i.email}</td>
                          <td className="capitalize">{i.rol}</td>
                          <td>{date(i.expira)}</td>
                          <td>
                            <span className="status">{state}</span>
                          </td>
                          <td>
                            {!i.aceptada && !i.revocada && (
                              <button
                                className="secondary"
                                disabled={Boolean(busy)}
                                onClick={() => revoke(i.id)}
                              >
                                Revocar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager
                page={invitePage}
                total={invitations.data.total}
                change={setInvitePage}
              />
            </>
          ) : (
            <Empty title="No hay invitaciones">
              Invitá a tu equipo desde el formulario de arriba.
            </Empty>
          ))
        )}
      </section>
    </>
  );
}
