import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../services/api';
import { useApp } from '../context/AppContext';

export default function useCompanyAccess(userId) {
  const { empresa, setEmpresa, cambiarModoViajaYa } = useApp();
  const knownCompany = useRef(empresa);
  knownCompany.current = empresa;
  useFocusEffect(useCallback(() => {
    let active = true;
    // Conservar la elección personal al regresar a una pantalla.
    const hadCompany = Boolean(knownCompany.current);
    if (userId) apiFetch('/business/mi-empresa').then(({ empresa }) => {
      if (!active) return;
      setEmpresa(empresa);
      if (!empresa) cambiarModoViajaYa('personal');
      else if (!hadCompany) cambiarModoViajaYa('business');
    }).catch(() => {
      if (active) { setEmpresa(null); cambiarModoViajaYa('personal'); }
    });
    return () => { active = false; };
  }, [userId, setEmpresa, cambiarModoViajaYa]));
}
