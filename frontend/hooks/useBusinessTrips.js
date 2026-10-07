import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getMyTrips } from '../services/api';

export default function useBusinessTrips(enabled = true, userId) {
  const [state, setState] = useState({ trips: [], loading: true, error: '' });
  const [refresh, setRefresh] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!enabled) return undefined;
    let active = true;
    setState({ trips: [], loading: true, error: '' });
    getMyTrips().then((trips) => {
      if (!Array.isArray(trips)) throw new Error('Respuesta de viajes inválida.');
      if (active) setState({ trips, loading: false, error: '' });
    }).catch((error) => {
      if (active) setState({ trips: [], loading: false, error: error.message || 'No pude cargar tus viajes.' });
    });
    return () => { active = false; };
  }, [enabled, userId, refresh]));
  return { ...state, retry: () => setRefresh((value) => value + 1) };
}
