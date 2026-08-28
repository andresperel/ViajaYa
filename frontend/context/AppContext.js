import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AppContext = createContext(null);

const NOTIFICACIONES = [
  { titulo: 'Hora de ahorrar', texto: 'Compará las tres opciones antes de elegir tu próximo viaje.' },
  { titulo: 'Consejo de seguridad', texto: 'Verificá la patente y el nombre del conductor antes de subir.' },
  { titulo: 'Menos demanda', texto: 'Los precios suelen bajar fuera de los horarios pico.' },
  { titulo: 'Tu historial está listo', texto: 'Confirmá cuáles viajes realizaste desde Mis viajes.' },
  { titulo: 'Nueva búsqueda mejorada', texto: 'Ahora encontrás direcciones reales y lugares de toda CABA.' },
  { titulo: 'Recordatorio', texto: 'Revisá origen y destino antes de continuar en la app elegida.' },
];

const crearNotificaciones = () => [...NOTIFICACIONES]
  .sort(() => Math.random() - 0.5)
  .slice(0, 4)
  .map((item, index) => ({ ...item, id: `${Date.now()}-${index}`, leida: false }));

export function AppProvider({ children }) {
  const [idioma, setIdioma] = useState('es');
  const [notificaciones, setNotificaciones] = useState(crearNotificaciones);
  const timerRef = useRef(null);

  useEffect(() => {
    let activo = true;
    const programarSiguiente = () => {
      // Entre 45 y 90 segundos para que sean visibles en una sesion de prueba
      // sin interrumpir constantemente al usuario.
      const demora = 45_000 + Math.floor(Math.random() * 45_000);
      timerRef.current = setTimeout(() => {
        if (!activo) return;
        const plantilla = NOTIFICACIONES[Math.floor(Math.random() * NOTIFICACIONES.length)];
        setNotificaciones((items) => {
          const nueva = { ...plantilla, id: `${Date.now()}-${Math.random()}`, leida: false };
          return [nueva, ...items].slice(0, 12);
        });
        programarSiguiente();
      }, demora);
    };
    programarSiguiente();
    return () => {
      activo = false;
      clearTimeout(timerRef.current);
    };
  }, []);
  const marcarNotificacionesLeidas = useCallback(() => {
    setNotificaciones((items) => items.some((item) => !item.leida)
      ? items.map((item) => ({ ...item, leida: true }))
      : items);
  }, []);

  const value = useMemo(() => ({
    idioma,
    setIdioma,
    notificaciones,
    marcarNotificacionesLeidas,
  }), [idioma, notificaciones, marcarNotificacionesLeidas]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
