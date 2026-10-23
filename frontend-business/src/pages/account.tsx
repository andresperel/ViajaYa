import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { api } from "../api";
import { active, useAuth } from "../auth";
import { Brand, ErrorBox, Notice, PageTitle } from "../ui";
import type { Company } from "../types";

interface Credentials {
  nombre: string;
  telefono: string;
  email: string;
  password: string;
  terms: boolean;
}
export function AuthPage({ register: signup = false }: { register?: boolean }) {
  const { context, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>();
  if (context)
    return (
      <Navigate
        to={
          sessionStorage.getItem("business-invitation")
            ? "/invitacion"
            : active(context)
              ? "/"
              : "/empresa/registro"
        }
        replace
      />
    );
  async function submit(values: Credentials) {
    setError("");
    setMessage("");
    try {
      if (signup) {
        await api("/auth/register", "POST", {
          nombre: values.nombre.trim(),
          telefono: values.telefono,
          email: values.email.trim().toLowerCase(),
          password: values.password,
        });
        setMessage("Cuenta creada. Iniciá sesión con tu correo y contraseña.");
      } else {
        await api("/auth/login", "POST", {
          username: values.email.trim(),
          password: values.password,
        });
        await refresh();
        navigate(
          "/dashboard",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main className="auth-layout" id="main">
      <section className="auth-story">
        <Brand />
        <div>
          <p className="eyebrow">CADA VIAJE, UN NUEVO IMPULSO</p>
          <h1>
            Tu equipo.
            <br />
            Su próximo destino.
          </h1>
          <p>
            Organizá la movilidad laboral de tu empresa en un solo lugar, con la
            identidad y la simpleza de ViajaYa.
          </p>
          <div className="journey-art" aria-hidden="true">
            <span>ORIGEN</span>
            <div className="journey-line">● ─ ─ ─ ─ ─ ─ ◇</div>
            <span>PRÓXIMO OBJETIVO</span>
          </div>
        </div>
        <small>
          Compará alternativas. Registrá tu actividad. Continuá con tu
          proveedor.
        </small>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <span className="badge">BUSINESS</span>
          <h2>{signup ? "Creá tu cuenta" : "Bienvenido de nuevo"}</h2>
          <p className="muted">
            {signup
              ? "Usá tu cuenta ViajaYa también para trabajar."
              : "Ingresá con tu cuenta de ViajaYa."}
          </p>
          {sessionStorage.getItem("business-invitation") && (
            <Notice>
              Tenés una invitación pendiente. Ingresá con el correo que la
              recibió.
            </Notice>
          )}
          <ErrorBox message={error} />
          {message ? (
            <Notice>
              {message} <Link to="/login">Ir a iniciar sesión →</Link>
            </Notice>
          ) : (
            <form onSubmit={handleSubmit(submit)} noValidate>
              <fieldset disabled={isSubmitting}>
                {signup && (
                  <>
                    <label>
                      Nombre completo
                      <input
                        autoComplete="name"
                        {...register("nombre", {
                          required: "Ingresá tu nombre.",
                          minLength: {
                            value: 3,
                            message: "Mínimo 3 caracteres.",
                          },
                          maxLength: 50,
                          pattern: {
                            value: /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u,
                            message: "Ingresá un nombre válido.",
                          },
                        })}
                      />
                      <small className="field-error">
                        {errors.nombre?.message}
                      </small>
                    </label>
                    <label>
                      Teléfono
                      <input
                        autoComplete="tel"
                        {...register("telefono", {
                          required: "Ingresá tu teléfono.",
                          validate: (v) =>
                            /^\d{8,15}$/.test(v.replace(/\D/g, "")) ||
                            "Ingresá entre 8 y 15 dígitos.",
                        })}
                      />
                      <small className="field-error">
                        {errors.telefono?.message}
                      </small>
                    </label>
                  </>
                )}
                <label>
                  {signup ? "Correo electrónico" : "Usuario administrador"}
                  <input
                    type={signup ? "email" : "text"}
                    autoComplete={signup ? "email" : "username"}
                    maxLength={100}
                    placeholder={signup ? "vos@tuempresa.com" : "admin1"}
                    {...register("email", {
                      required: signup ? "Ingresá tu correo." : "Ingresá tu usuario.",
                      ...(signup ? { pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Ingresá un correo válido.",
                      } } : {}),
                    })}
                  />
                    <small className="field-error">{errors.email?.message}</small>
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    autoComplete={signup ? "new-password" : "current-password"}
                    {...register("password", {
                      required: "Ingresá tu contraseña.",
                      ...(signup
                        ? {
                            minLength: {
                              value: 8,
                              message: "Mínimo 8 caracteres.",
                            },
                            maxLength: {
                              value: 30,
                              message: "Máximo 30 caracteres.",
                            },
                            validate: (v: string) =>
                              new TextEncoder().encode(v).length <= 72 ||
                              "La contraseña supera 72 bytes.",
                          }
                        : {}),
                    })}
                  />
                  <small className="field-error">
                    {errors.password?.message}
                  </small>
                </label>
                {signup && (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      {...register("terms", {
                        required: "Confirmá para continuar.",
                      })}
                    />
                    <span>
                      Entiendo que ViajaYa registra estimaciones y que las
                      reservas se confirman con cada proveedor.
                      <small className="field-error">
                        {errors.terms?.message}
                      </small>
                    </span>
                  </label>
                )}
                <button className="full" type="submit">
                  {isSubmitting
                    ? "Procesando…"
                    : signup
                      ? "Crear cuenta"
                      : "Iniciar sesión →"}
                </button>
              </fieldset>
            </form>
          )}
          {signup && <p className="auth-switch">El registro web está deshabilitado.</p>}
        </div>
      </section>
    </main>
  );
}
interface CompanyFields {
  nombre: string;
  razonSocial: string;
  identificacionFiscal: string;
  direccion: string;
}
function CompanyForm({
  company,
  create = false,
}: {
  company?: Company;
  create?: boolean;
}) {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFields>({
    defaultValues: company || {
      nombre: "",
      razonSocial: "",
      identificacionFiscal: "",
      direccion: "",
    },
  });
  async function submit(values: CompanyFields) {
    setError("");
    setMessage("");
    try {
      await api(
        create ? "/empresas" : "/empresa",
        create ? "POST" : "PATCH",
        values,
      );
      await refresh();
      if (create) navigate("/");
      else setMessage("Datos de empresa actualizados.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <ErrorBox message={error} />
      {message && <Notice>{message}</Notice>}
      <fieldset disabled={isSubmitting}>
        <label>
          Nombre de empresa
          <input
            {...register("nombre", {
              required: "Ingresá el nombre.",
              minLength: { value: 2, message: "Mínimo 2 caracteres." },
              maxLength: { value: 100, message: "Máximo 100 caracteres." },
            })}
          />
          <small className="field-error">{errors.nombre?.message}</small>
        </label>
        <label>
          Razón social <span className="optional">opcional</span>
          <input maxLength={150} {...register("razonSocial")} />
        </label>
        <label>
          Identificación fiscal <span className="optional">opcional</span>
          <input maxLength={30} {...register("identificacionFiscal")} />
        </label>
        <label>
          Dirección <span className="optional">opcional</span>
          <input maxLength={200} {...register("direccion")} />
        </label>
        <button type="submit">
          {isSubmitting
            ? "Guardando…"
            : create
              ? "Registrar empresa →"
              : "Guardar cambios"}
        </button>
      </fieldset>
    </form>
  );
}
export function CompanyRegistration() {
  const { context } = useAuth();
  if (active(context)) return <Navigate to="/" replace />;
  return (
    <>
      <PageTitle title="Tu empresa empieza acá" />
      <div className="card narrow">
        {context?.membresia ? (
          <Notice>
            Tu asociación empresarial no está activa. Contactá a un
            administrador. Conservamos tu historial y no crearemos una segunda
            asociación.
          </Notice>
        ) : (
          <>
            <h2>Registrá tu empresa</h2>
            <p className="muted">
              Vas a ser su primer administrador. Después podrás invitar a tu
              equipo.
            </p>
            <CompanyForm create />
          </>
        )}
        <p className="muted">
          ¿Te invitaron a una empresa?{" "}
          <Link to="/invitacion">Aceptar invitación</Link>
        </p>
      </div>
    </>
  );
}
export function InvitationPage() {
  const { context, refresh } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState(
    () => sessionStorage.getItem("business-invitation") || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function accept() {
    setBusy(true);
    setError("");
    try {
      await api("/invitaciones/aceptar", "POST", { token });
      sessionStorage.removeItem("business-invitation");
      await refresh();
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="Sumate a tu equipo" />
      <section className="card narrow">
        <span className="big-icon">✉</span>
        <h2>Aceptar invitación</h2>
        <p>
          Estás conectado como <strong>{context?.usuario.email}</strong>. El
          correo debe coincidir con el destinatario de la invitación.
        </p>
        <Notice>
          Las invitaciones son personales, vencen a las 72 horas y se pueden
          usar una sola vez.
        </Notice>
        <ErrorBox message={error} />
        {token ? (
          <button disabled={busy} onClick={accept}>
            {busy ? "Verificando…" : "Aceptar y acceder a mi empresa →"}
          </button>
        ) : (
          <EmptyInvitation />
        )}
        <button
          className="text-button"
          onClick={() => {
            sessionStorage.removeItem("business-invitation");
            setToken("");
          }}
        >
          Descartar enlace guardado
        </button>
      </section>
    </>
  );
}
function EmptyInvitation() {
  return (
    <p>
      Para continuar, abrí en este navegador el enlace que recibiste por correo.
      Si venció o fue revocado, pedí una nueva invitación a tu administrador.
    </p>
  );
}
export function Settings() {
  const { context } = useAuth();
  return (
    <>
      <PageTitle title="Configuración" />
      <div className="two-columns">
        <section className="card">
          <h2>Tu perfil</h2>
          <dl>
            <dt>Nombre</dt>
            <dd>{context?.usuario.nombre}</dd>
            <dt>Correo</dt>
            <dd>{context?.usuario.email}</dd>
            <dt>Teléfono</dt>
            <dd>{context?.usuario.telefono || "Sin teléfono registrado"}</dd>
            <dt>Acceso empresarial</dt>
            <dd>
              {context?.membresia?.rol || "Sin asociación"}
              {context?.membresia && !active(context) ? " · Inactivo" : ""}
            </dd>
          </dl>
          <Notice>
            Tu cuenta es compartida con ViajaYa Mobile. La sesión de este
            navegador se cierra desde el menú lateral.
          </Notice>
        </section>
        <section className="card">
          <h2>Datos de empresa</h2>
          {context?.empresa ? (
            context.membresia?.rol === "administrador" && active(context) ? (
              <CompanyForm company={context.empresa} />
            ) : (
              <dl>
                <dt>Empresa</dt>
                <dd>{context.empresa.nombre}</dd>
                <dt>Razón social</dt>
                <dd>{context.empresa.razonSocial || "Sin informar"}</dd>
                <dt>Dirección</dt>
                <dd>{context.empresa.direccion || "Sin informar"}</dd>
              </dl>
            )
          ) : (
            <p>
              Primero <Link to="/empresa/registro">registrá tu empresa</Link> o
              aceptá una invitación.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
