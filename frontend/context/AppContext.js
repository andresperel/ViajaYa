import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [idioma, setIdioma] = useState('es');
  const [modoViajaYa, setModoViajaYa] = useState('personal');
  const [empresa, setEmpresa] = useState(null);
  const cambiarModoViajaYa = useCallback((modo) => {
    if (!['personal', 'business'].includes(modo)) throw new Error('Modo de ViajaYa inválido.');
    setModoViajaYa(modo);
  }, []);
  const [notificaciones, setNotificaciones] = useState([]);
  const siguienteId = useRef(0);

  const agregarNotificacion = useCallback(({ titulo, texto }) => {
    const nueva = {
      id: `notificacion-${++siguienteId.current}`,
      titulo,
      texto,
      leida: false,
    };
    setNotificaciones((items) => [nueva, ...items].slice(0, 12));
  }, []);

  const marcarNotificacionesLeidas = useCallback(() => {
    setNotificaciones((items) => items.some((item) => !item.leida)
      ? items.map((item) => ({ ...item, leida: true }))
      : items);
  }, []);

  const value = useMemo(() => ({
    idioma,
    modoViajaYa,
    empresa,
    setEmpresa,
    cambiarModoViajaYa,
    setIdioma,
    notificaciones,
    agregarNotificacion,
    marcarNotificacionesLeidas,
  }), [idioma, modoViajaYa, empresa, cambiarModoViajaYa, notificaciones, agregarNotificacion, marcarNotificacionesLeidas]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useApp debe utilizarse dentro de AppProvider.');
  }
  return context;
}
