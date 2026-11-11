import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router";
import { active, useAuth } from "./auth";
import { TripFlowProvider } from "./flow";
import { Brand, ErrorBox } from "./ui";
import {
  AuthPage,
  Settings,
} from "./pages/account";
import {
  Home,
  Results,
 
  Dashboard,
} from "./pages/trips";
import { Employees } from "./pages/employees";

function RequireLogin() {
  return useAuth().context ? <Outlet /> : <Navigate to="/login" replace />;
}
function RequireMember() {
  const { context } = useAuth();
  return active(context) ? (
    <TripFlowProvider key={context?.usuario.idUsuario}>
      <Outlet />
    </TripFlowProvider>
  ) : (
    <Navigate to="/empresa/registro" replace />
  );
}
function RequireAdmin() {
  return useAuth().context?.membresia?.rol === "administrador" ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
function Layout() {
  const { context, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const member = active(context);
  const admin = member && context?.membresia?.rol === "administrador";
  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="shell">
      <button
        className="mobile-menu secondary"
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => setOpen(!open)}
      >
        ☰ Menú
      </button>
      <aside className={open ? "sidebar open" : "sidebar"} id="navigation">
        <Link to="/" className="brand-link">
          <Brand />
        </Link>
        <div className="company-chip">
          <span className="company-icon">↗</span>
          <div>
            <strong>{context?.empresa?.nombre || "Tu espacio Business"}</strong>
            <small>{context?.membresia?.rol || "Sin empresa activa"}</small>
          </div>
        </div>
        <p className="nav-label">MI ESPACIO</p>
        <nav onClick={() => setOpen(false)}>
          {member && (
            <>
              <NavLink to="/" end>
                ⌂ <span>Inicio</span>
              </NavLink>
             
              
            </>
          )}
          {admin && (
            <>
              <p className="nav-label">ADMINISTRACIÓN</p>
              <NavLink to="/dashboard">
                ▥ <span>Dashboard</span>
              </NavLink>
              <NavLink to="/empleados">
                ♧ <span>Empleados</span>
              </NavLink>
            </>
          )}
          <NavLink to="/configuracion">
            ⚙ <span>Configuración</span>
          </NavLink>
          {!member && (
            <NavLink to="/empresa/registro">
              ＋ <span>Empresa</span>
            </NavLink>
          )}
          <NavLink to="/invitacion">
            ✉ <span>Aceptar invitación</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <strong>{context?.usuario.nombre}</strong>
          <small>{context?.usuario.email}</small>
          <button className="secondary" disabled={busy} onClick={signOut}>
            {busy ? "Cerrando…" : "Cerrar sesión ↪"}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            ViajaYa <span className="muted">/ Business</span>
          </span>
          <span className="session-label">
            <i /> Espacio empresarial
          </span>
        </header>
        <main id="main">
          <ErrorBox message={error} />
          <Outlet />
        </main>
        <footer className="main-footer">
          ViajaYa Business · Movilidad laboral con información clara.
          <span>
            Estimaciones orientativas. La reserva se confirma en el proveedor.
          </span>
        </footer>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <Routes>
        <Route path="/login" element={<AuthPage key="login" />} />
        <Route element={<RequireLogin />}>
          <Route element={<Layout />}>
            <Route path="/configuracion" element={<Settings />} />
            <Route element={<RequireMember />}>
              <Route index element={<Home />} />
             
              <Route path="/resultados" element={<Results />} />
             
              <Route element={<RequireAdmin />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/empleados" element={<Employees />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
