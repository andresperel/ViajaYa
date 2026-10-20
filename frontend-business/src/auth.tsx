import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, initCsrf, getEnvironment } from "./api";
import type { Context } from "./types";
import { ErrorBox, Loading } from "./ui";
interface AuthState {
  context: Context | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  ready: boolean;
}
const Auth = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Context | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setContext(await api<Context>("/contexto"));
      setError("");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setContext(null);
      else throw e;
    }
  }
  useEffect(() => {
    initCsrf()
      .then(refresh)
      .catch((e) => setError(e.message))
      .finally(() => setReady(true));
    const expired = () => {
      setContext(null);
    };
    window.addEventListener("business-session-expired", expired);
    return () =>
      window.removeEventListener("business-session-expired", expired);
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", "POST", {});
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    setContext(null);
    await initCsrf();
  }
  return (
    <Auth.Provider value={{ context, refresh, logout, ready }}>
      {ready && getEnvironment() === "disposable-local" && (
        <div className="local-banner" role="status">
          <strong>ENTORNO LOCAL DE PRUEBA</strong> · PostgreSQL desechable ·
          recorridos simulados · sin correos ni reservas reales. Usá cuentas y
          contraseñas de prueba.{" "}
          <a href="/__local/mail" target="_blank" rel="noopener noreferrer">
            Abrir buzón local ↗
          </a>
        </div>
      )}
      {!ready ? (
        <Loading />
      ) : error ? (
        <main className="auth-card">
          <ErrorBox message={error} />
          <button onClick={() => window.location.reload()}>
            Reintentar conexión
          </button>
        </main>
      ) : (
        children
      )}
    </Auth.Provider>
  );
}
export function useAuth() {
  const auth = useContext(Auth);
  if (!auth) throw new Error("Falta AuthProvider");
  return auth;
}
export function active(context: Context | null) {
  return Boolean(context?.membresia?.activo && context.empresa?.activa);
}
