import { useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
export const money = (value: number | string) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value));
export const date = (value: string) =>
  new Date(
    value.length === 10 ? `${value}T12:00:00` : value,
  ).toLocaleDateString("es-AR");
export const initialPeriod = () => {
  const now = new Date();
  const local = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    desde: local(new Date(now.getFullYear(), now.getMonth(), 1)),
    hasta: local(now),
  };
};
export function useRemote<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    api<T>(path, "GET", undefined, controller.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, refresh: () => setVersion((v) => v + 1) };
}
export function ErrorBox({ message }: { message?: string }) {
  return message ? (
    <div role="alert" className="notice error">
      {message}
    </div>
  ) : null;
}
export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Cargando información…
    </div>
  );
}
export function Empty({
  title = "Todavía no hay registros",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span aria-hidden="true">↗</span>
      <h3>{title}</h3>
      <p>
        {children ||
          "La actividad aparecerá aquí cuando empieces a usar ViajaYa Business."}
      </p>
    </div>
  );
}
export function PageTitle({
  eyebrow = "TU MOVILIDAD LABORAL",
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export function Period({
  value,
  onChange,
}: {
  value: { desde: string; hasta: string };
  onChange: (v: { desde: string; hasta: string }) => void;
}) {
  return (
    <div className="period">
      <label>
        Desde
        <input
          aria-label="Desde"
          type="date"
          value={value.desde}
          max={value.hasta}
          onChange={(e) => onChange({ ...value, desde: e.target.value })}
        />
      </label>
      <label>
        Hasta
        <input
          aria-label="Hasta"
          type="date"
          value={value.hasta}
          min={value.desde}
          onChange={(e) => onChange({ ...value, hasta: e.target.value })}
        />
      </label>
    </div>
  );
}
export function Pager({
  page,
  total,
  size = 20,
  change,
}: {
  page: number;
  total: number;
  size?: number;
  change: (p: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {total} registros · Página {page} de{" "}
        {Math.max(1, Math.ceil(total / size))}
      </span>
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => change(page - 1)}
      >
        Anterior
      </button>
      <button
        className="secondary"
        disabled={page * size >= total}
        onClick={() => change(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <img src="/branding/logo-viajaya.png" alt="ViajaYa" />
      <span>BUSINESS</span>
    </div>
  );
}
