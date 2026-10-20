import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { api } from "../api";
import { useAuth } from "../auth";
import { useTripFlow } from "../flow";
import type {
  Address,
  Page,
  Quote,
  Registration,
  Summary,
  Trip,
} from "../types";
import {
  date,
  Empty,
  ErrorBox,
  initialPeriod,
  Loading,
  money,
  Notice,
  PageTitle,
  Pager,
  Period,
  useRemote,
} from "../ui";

const disclaimer =
  "Estimaciones orientativas de ViajaYa, no cotizaciones de los proveedores. Seleccionar una opción registra tu intención laboral; no confirma una reserva ni un pago.";
export function Home() {
  const { context } = useAuth();
  const period = initialPeriod();
  const { data, error, loading, refresh } = useRemote<Summary>(
    `/resumen-personal?${new URLSearchParams(period)}`,
  );
  return (
    <>
      <PageTitle title={`Hola, ${context?.usuario.nombre.split(" ")[0]}`}>
        <span className="badge">{context?.empresa?.nombre}</span>
      </PageTitle>
      <section className="hero">
        <div>
          <p className="eyebrow">MENOS VUELTAS. MÁS CAMINO.</p>
          <h2>
            Tu próximo viaje laboral,
            <br />
            desde un solo lugar.
          </h2>
          <p>
            Compará alternativas de movilidad y llevá un registro claro de tus
            recorridos.
          </p>
          <Link className="button" to="/solicitar">
            Solicitar mi viaje <span>↗</span>
          </Link>
        </div>
        <div className="route-illustration" aria-hidden="true">
          <div className="route-node">
            ● <span>Tu punto de partida</span>
          </div>
          <div className="route-path" />
          <div className="route-node destination">
            ◇ <span>Tu próximo destino</span>
          </div>
          <span className="route-tag">VIAJÁ CON PROPÓSITO</span>
        </div>
      </section>
      <PageTitle eyebrow="ESTE MES" title="Tu actividad" />
      <ErrorBox message={error} />
      {error && (
        <button className="secondary" onClick={refresh}>
          Reintentar
        </button>
      )}
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats">
              <Stat
                title="Viajes laborales registrados"
                value={data.cantidad}
              />
              <Stat
                title="Importe orientativo registrado"
                value={money(data.totalEstimado)}
                note="Solo registros con moneda ARS identificada"
              />
              <Stat
                title="Proveedores seleccionados"
                value={data.proveedores.length}
              />
            </div>
            {data.cantidad === 0 && (
              <Empty title="El primer recorrido está por venir">
                Solicitá tu primer viaje laboral. Acá aparecerá tu actividad
                real.
              </Empty>
            )}
            {data.registrosSinMoneda > 0 && (
              <Notice>
                {data.registrosSinMoneda} registros anteriores sin moneda
                identificada no se suman al importe.
              </Notice>
            )}
          </>
        )
      )}
      <div className="two-columns quick-links">
        <Link className="card" to="/mis-viajes">
          <span>≡</span>
          <h3>Tu historial, a mano</h3>
          <p>Consultá recorridos, motivos y estimaciones.</p>
          <strong>Ver mis viajes →</strong>
        </Link>
        <div className="card">
          <span>◇</span>
          <h3>Vos elegís cómo seguir</h3>
          <p>
            La solicitud y el precio final se confirman en Uber, Cabify o DiDi.
            ViajaYa conserva tu registro laboral.
          </p>
        </div>
      </div>
    </>
  );
}
function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string | number;
  note?: string;
}) {
  return (
    <section className="card stat">
      <p>{title}</p>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </section>
  );
}
function AddressField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Address | null;
  onChange: (v: Address | null) => void;
}) {
  const [query, setQuery] = useState(value?.label || "");
  const [options, setOptions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (query.length < 3 || value?.label === query) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      api<{ sugerencias: Address[] }>(
        `/direcciones/sugerencias?q=${encodeURIComponent(query)}`,
        "GET",
        undefined,
        controller.signal,
      )
        .then((v) => setOptions(v.sugerencias))
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, value]);
  return (
    <div className="address-field">
      <label>
        {title}
        <input
          autoComplete="off"
          maxLength={160}
          value={query}
          placeholder="Ingresá calle y altura en CABA"
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
          }}
          aria-describedby={`${title}-help`}
        />
      </label>
      <small id={`${title}-help`} className="muted">
        {value
          ? "✓ Dirección seleccionada"
          : loading
            ? "Buscando direcciones…"
            : "Escribí al menos 3 caracteres y elegí una sugerencia."}
      </small>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
      {options.length > 0 && (
        <ul className="suggestions" aria-label={`Sugerencias de ${title}`}>
          {options.map((o, i) => (
            <li key={`${o.label}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(o);
                  setQuery(o.label);
                  setOptions([]);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
export function RequestTrip() {
  const { setQuote } = useTripFlow();
  const [origin, setOrigin] = useState<Address | null>(null);
  const [destination, setDestination] = useState<Address | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<{ motivoViaje: string }>();
  async function submit(values: { motivoViaje: string }) {
    setError("");
    if (!origin || !destination) {
      setError("Elegí origen y destino desde las sugerencias.");
      return;
    }
    if (origin.coordinates.every((v, i) => v === destination.coordinates[i])) {
      setError("El origen y el destino deben ser diferentes.");
      return;
    }
    try {
      const quote = await api<Quote>("/comparaciones", "POST", {
        origen: origin.label.slice(0, 160),
        destino: destination.label.slice(0, 160),
        origenCoordenadas: origin.coordinates,
        destinoCoordenadas: destination.coordinates,
        motivoViaje: values.motivoViaje,
      });
      setQuote(quote);
      navigate("/resultados");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <PageTitle title="¿A dónde vamos?" />
      <div className="two-columns trip-columns">
        <section className="card">
          <h2>Solicitá tu viaje laboral</h2>
          <p className="muted">
            El recorrido se registra a tu nombre y se asocia a tu empresa.
          </p>
          <ErrorBox message={error} />
          <form onSubmit={handleSubmit(submit)}>
            <fieldset disabled={isSubmitting}>
              <AddressField
                title="Origen"
                value={origin}
                onChange={setOrigin}
              />
              <AddressField
                title="Destino"
                value={destination}
                onChange={setDestination}
              />
              <label>
                Motivo laboral <span className="optional">opcional</span>
                <textarea
                  rows={3}
                  maxLength={200}
                  placeholder="Por ejemplo, reunión con un cliente"
                  {...register("motivoViaje", {
                    maxLength: {
                      value: 200,
                      message: "Máximo 200 caracteres.",
                    },
                  })}
                />
                <small className="field-error">
                  {errors.motivoViaje?.message}
                </small>
              </label>
              <button className="full" type="submit">
                {isSubmitting
                  ? "Comparando alternativas…"
                  : "Comparar alternativas →"}
              </button>
            </fieldset>
          </form>
        </section>
        <aside className="card guide">
          <span className="big-icon">↗</span>
          <h2>
            Un recorrido.
            <br />
            Tus alternativas.
          </h2>
          <ol>
            <li>Elegí un origen y un destino.</li>
            <li>Compará importes orientativos.</li>
            <li>Registrá tu intención y continuá con el proveedor.</li>
          </ol>
          <Notice>{disclaimer}</Notice>
          <p className="muted">
            Cobertura actual del buscador: área configurada alrededor de CABA.
            No se garantiza disponibilidad de conductores.
          </p>
        </aside>
      </div>
    </>
  );
}
export function Results() {
  const { quote } = useTripFlow();
  const [key] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Registration | null>(null);
  if (!quote)
    return (
      <>
        <PageTitle title="Comparación de alternativas" />
        <Empty title="Primero elegí tu recorrido">
          <Link to="/solicitar">Ir a solicitar viaje →</Link>
        </Empty>
      </>
    );
  async function select(provider: string) {
    if (!quote) return;
    setBusy(provider);
    setError("");
    try {
      setSaved(
        await api<Registration>("/viajes", "POST", {
          comparacionId: quote.id,
          clave: key,
          proveedor: provider,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageTitle
        title={
          saved
            ? "Tu intención quedó registrada"
            : "Compará y elegí cómo seguir"
        }
      >
        <Link className="button secondary" to="/solicitar">
          Otro recorrido
        </Link>
      </PageTitle>
      <div className="card route-summary">
        <div>
          <small>ORIGEN</small>
          <strong>{quote.origen.label}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>DESTINO</small>
          <strong>{quote.destino.label}</strong>
        </div>
        <span className="badge">
          {quote.ruta.distanciaKm} km · {quote.ruta.duracionMin} min aprox.
        </span>
      </div>
      <Notice>{disclaimer}</Notice>
      <ErrorBox message={error} />
      {saved ? (
        <section className="card continuation">
          <span className="badge">
            INTENCIÓN REGISTRADA · SIN RESERVA CONFIRMADA
          </span>
          <h2>Continuá con {saved.proveedor}</h2>
          <p>{saved.continuacion.mensaje}</p>
          {saved.continuacion.modo === "telefono" && (
            <div className="copy-route">
              <p>
                <strong>Origen:</strong> {quote.origen.label}
              </p>
              <p>
                <strong>Destino:</strong> {quote.destino.label}
              </p>
              <p>
                Tené estos datos a mano e ingresalos en la aplicación del
                proveedor. ViajaYa no puede verificar su confirmación.
              </p>
            </div>
          )}
          <a
            className="button"
            href={saved.continuacion.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {saved.continuacion.modo === "web"
              ? `Abrir ${saved.proveedor} y continuar ↗`
              : `Abrir sitio oficial de ${saved.proveedor} ↗`}
          </a>
          <Link className="button secondary" to="/mis-viajes">
            Ver mi registro
          </Link>
        </section>
      ) : (
        <>
          <p className="muted">
            Comparación válida hasta{" "}
            {new Date(quote.expira).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Duración de recorrido estimada; tiempo de llegada del conductor no
            disponible.
          </p>
          <div className="options">
            {[...quote.opciones]
              .sort((a, b) => a.precio - b.precio)
              .map((option) => (
                <section className="card provider" key={option.empresa}>
                  <div
                    className={`provider-icon ${option.empresa.toLowerCase()}`}
                  >
                    {option.empresa === "Uber"
                      ? "U"
                      : option.empresa === "DiDi"
                        ? "D"
                        : "C"}
                  </div>
                  <h2>{option.empresa}</h2>
                  <p className="muted">
                    Categoría de referencia: {option.tipo}
                  </p>
                  <div className="price">
                    {money(option.precio)}
                    <small>ARS · estimación ViajaYa</small>
                  </div>
                  <p>Recorrido: {option.duracionMin} min aprox.</p>
                  <button
                    className="full"
                    disabled={Boolean(busy)}
                    onClick={() => select(option.empresa)}
                  >
                    {busy === option.empresa
                      ? "Registrando…"
                      : `Elegir ${option.empresa} →`}
                  </button>
                  <small>No confirma una reserva.</small>
                </section>
              ))}
          </div>
        </>
      )}
      {quote.motivoViaje && (
        <p className="muted">Motivo: {quote.motivoViaje}</p>
      )}
    </>
  );
}
export function TripHistory({ company = false }: { company?: boolean }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [page, setPage] = useState(1);
  const query = new URLSearchParams({ ...period, page: String(page) });
  const { data, loading, error, refresh } = useRemote<Page<Trip>>(
    `/${company ? "viajes" : "mis-viajes"}?${query}`,
  );
  return (
    <>
      {!company && <PageTitle title="Mis viajes laborales" />}
      <div className="card">
        <div className="section-heading">
          <div>
            <h2>{company ? "Registros de la empresa" : "Tu historial"}</h2>
            <p className="muted">
              Los registros no acreditan reservas, pagos ni viajes realizados.
            </p>
          </div>
          <Period
            value={period}
            onChange={(p) => {
              setPeriod(p);
              setPage(1);
            }}
          />
        </div>
        <ErrorBox message={error} />
        {error && (
          <button className="secondary" onClick={refresh}>
            Reintentar
          </button>
        )}
        {loading ? (
          <Loading />
        ) : (
          data &&
          (data.items.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha / proveedor</th>
                      {company && <th>Persona</th>}
                      <th>Recorrido</th>
                      <th>Motivo</th>
                      <th>Importe orientativo</th>
                      <th>Estado del registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((t) => (
                      <tr key={t.idViaje}>
                        <td>
                          <strong>{date(t.fechaViaje)}</strong>
                          <small className="capitalize">
                            {t.proveedor || "Sin proveedor identificado"}
                          </small>
                        </td>
                        {company && (
                          <td>
                            {t.Usuario?.nombre}
                            <small>{t.Usuario?.email}</small>
                          </td>
                        )}
                        <td>
                          {t.calleOrigen}
                          <small>→ {t.calleDestino}</small>
                        </td>
                        <td>{t.motivoViaje || "Sin motivo"}</td>
                        <td>
                          {t.BusinessRegistro?.moneda === "ARS" ? (
                            <>
                              {money(t.precioEstimado)}
                              <small>ARS · estimación ViajaYa</small>
                            </>
                          ) : (
                            <>
                              {Number(t.precioEstimado).toLocaleString("es-AR")}
                              <small>Estimado · moneda no verificada</small>
                            </>
                          )}
                        </td>
                        <td>
                          <span className="status">
                            {t.BusinessRegistro
                              ? "Intención registrada"
                              : "Registro anterior"}
                          </span>
                          <small>Sin confirmación externa acreditada</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={page} total={data.total} change={setPage} />
            </>
          ) : (
            <Empty title="Sin registros en este período">
              Probá otro período o{" "}
              <Link to="/solicitar">solicitá tu próximo viaje</Link>.
            </Empty>
          ))
        )}
      </div>
    </>
  );
}
export function Dashboard() {
  const [period, setPeriod] = useState(initialPeriod);
  const { data, loading, error, refresh } = useRemote<Summary>(
    `/estadisticas?${new URLSearchParams(period)}`,
  );
  return (
    <>
      <PageTitle eyebrow="ADMINISTRACIÓN" title="Movilidad de tu empresa">
        <Period value={period} onChange={setPeriod} />
      </PageTitle>
      <Notice>
        Los importes son estimaciones registradas, no gastos pagados. Los
        conteos corresponden a registros laborales, no a viajes realizados.
      </Notice>
      <ErrorBox message={error} />
      {error && (
        <button className="secondary" onClick={refresh}>
          Reintentar
        </button>
      )}
      {loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats">
              <Stat
                title="Viajes laborales registrados"
                value={data.cantidad}
              />
              <Stat
                title="Importe orientativo · ARS"
                value={money(data.totalEstimado)}
                note={`${data.registrosConMoneda} registros con moneda identificada`}
              />
              <Stat
                title="Personas con actividad"
                value={data.actividad.length}
              />
            </div>
            {data.registrosSinMoneda > 0 && (
              <Notice>
                {data.registrosSinMoneda} registros sin moneda verificada se
                excluyen del importe agregado.
              </Notice>
            )}
            {data.cantidad > 0 ? (
              <>
                <div className="two-columns">
                  <section className="card">
                    <h2>Proveedores seleccionados</h2>
                    <p className="muted">Cantidad de registros por proveedor</p>
                    <div className="bars">
                      {data.proveedores.map((p) => (
                        <div key={p.proveedor}>
                          <div className="bar-label">
                            <strong className="capitalize">
                              {p.proveedor}
                            </strong>
                            <span>{p.cantidad}</span>
                          </div>
                          <div className="bar-track">
                            <div
                              style={{
                                width: `${(100 * p.cantidad) / data.cantidad}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="card">
                    <h2>Actividad por día</h2>
                    {data.diario.length >= 2 ? (
                      <ActivityChart days={data.diario} />
                    ) : (
                      <p className="muted">
                        El gráfico aparecerá cuando haya actividad en al menos
                        dos días del período.
                      </p>
                    )}
                    <div className="table-scroll chart-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Registros</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.diario.map((d) => (
                            <tr key={d.fecha}>
                              <td>{date(d.fecha)}</td>
                              <td>{d.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
                <section className="card">
                  <h2>Actividad por empleado</h2>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Persona</th>
                          <th>Registros</th>
                          <th>Importe orientativo · ARS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.actividad.map((a) => (
                          <tr key={a.idUsuario}>
                            <td>
                              <strong>{a.nombre}</strong>
                              <small>{a.email}</small>
                            </td>
                            <td>{a.cantidad}</td>
                            <td>{money(a.totalEstimado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : (
              <Empty title="El dashboard se construye con tu actividad">
                Los gráficos y los totales aparecerán cuando se registren viajes
                laborales reales.
              </Empty>
            )}
          </>
        )
      )}
      <TripHistory company />
    </>
  );
}
function ActivityChart({ days }: { days: Summary["diario"] }) {
  const max = Math.max(...days.map((d) => d.cantidad), 1);
  const points = days
    .map(
      (d, i) =>
        `${20 + (i * 460) / (days.length - 1)},${150 - (d.cantidad / max) * 120}`,
    )
    .join(" ");
  return (
    <svg
      className="activity-chart"
      viewBox="0 0 500 180"
      role="img"
      aria-label="Cantidad de registros por día; valores detallados en la tabla siguiente"
    >
      <line x1="20" x2="480" y1="150" y2="150" stroke="#33465d" />
      <polyline points={points} fill="none" stroke="#7dd3fc" strokeWidth="3" />
      {days.map((d, i) => (
        <circle
          key={d.fecha}
          cx={20 + (i * 460) / (days.length - 1)}
          cy={150 - (d.cantidad / max) * 120}
          r="4"
          fill="#7dd3fc"
        >
          <title>
            {date(d.fecha)}: {d.cantidad} registros
          </title>
        </circle>
      ))}
    </svg>
  );
}
