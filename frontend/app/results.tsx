import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { C, GradientButton, IconButton, ScreenTitle } from '@/components/ui';
import { Service, ServiceCard } from '@/components/service-card';
import { apiFetch } from '@/services/api';

type ApiOption = {
  empresa: string;
  tipo: string;
  precio: number;
  llegadaMin: number;
  duracionMin: number;
  confort: number;
  rating: number;
  recomendacion: string;
  idTipoServicio: number;
};
type ApiTrip = {
  ruta: { distanciaKm: number; duracionMin: number };
  origen: { label: string };
  destino: { label: string };
  opciones: ApiOption[];
};

const tones = ['#F05A28', '#0B0F18', '#2563EB', '#0D9488'];

export default function Results() {
  const router = useRouter();
  const { trip: raw } = useLocalSearchParams<{ trip?: string }>();
  const trip = useMemo<ApiTrip | null>(() => {
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, [raw]);
  const rides = useMemo<Service[]>(() => trip?.opciones.map((option, index) => ({
    brand: option.empresa,
    tier: option.tipo,
    price: `$${option.precio.toLocaleString('es-AR')}`,
    eta: `${option.llegadaMin} min`,
    rating: option.rating.toFixed(1),
    comfort: option.confort >= 4.5 ? 'alto' : 'medio',
    badge: option.recomendacion.toUpperCase(),
    tone: tones[index % tones.length],
  })) || [], [trip]);
  const [sort, setSort] = useState('Recomendado');
  const [chosen, setChosen] = useState(0);
  const [saving, setSaving] = useState(false);

  const best = sort === 'Más barato'
    ? rides.reduce((bestIndex, item, index) => Number(item.price.replace(/\D/g, '')) < Number(rides[bestIndex].price.replace(/\D/g, '')) ? index : bestIndex, 0)
    : sort === 'Más rápido'
      ? rides.reduce((bestIndex, item, index) => Number(item.eta.replace(/\D/g, '')) < Number(rides[bestIndex].eta.replace(/\D/g, '')) ? index : bestIndex, 0)
      : 0;
  const ordered = rides.length ? [rides[best], ...rides.filter((_, index) => index !== best)] : [];

  const selectFilter = (next: string) => {
    setSort(next);
    if (next === 'Recomendado' || next === 'Confort') return setChosen(0);
    setChosen(next === 'Más barato'
      ? rides.reduce((bestIndex, item, index) => Number(item.price.replace(/\D/g, '')) < Number(rides[bestIndex].price.replace(/\D/g, '')) ? index : bestIndex, 0)
      : rides.reduce((bestIndex, item, index) => Number(item.eta.replace(/\D/g, '')) < Number(rides[bestIndex].eta.replace(/\D/g, '')) ? index : bestIndex, 0));
  };

  const confirmarViaje = async () => {
    if (!trip) return;
    const option = trip.opciones[chosen];
    setSaving(true);
    try {
      await apiFetch('/viaje', {
        method: 'POST',
        body: JSON.stringify({
          calleOrigen: trip.origen.label,
          calleDestino: trip.destino.label,
          precioEstimado: option.precio,
          tiempoEstimado: option.duracionMin || trip.ruta.duracionMin,
          idTipoServicio: option.idTipoServicio,
        }),
      });
      router.push('/confirmed');
    } catch (error) {
      Alert.alert('No pudimos guardar el viaje', error instanceof Error ? error.message : 'Revisá tu sesión e intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!trip || !rides.length) {
    return <View style={s.empty}><ScreenTitle title="No hay resultados" detail="Ingresá origen y destino desde la búsqueda para comparar opciones." /><GradientButton label="Buscar un viaje" onPress={() => router.replace('/search')} /></View>;
  }

  return <View style={s.page}>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.top}><IconButton name="arrow-back" onPress={() => router.back()} /><Text style={s.route} numberOfLines={1}>{trip.origen.label} → {trip.destino.label}</Text></View>
      <View style={s.head}><ScreenTitle eyebrow={`${rides.length} servicios disponibles`} title="Elegí cómo moverte" detail={`${trip.ruta.distanciaKm} km · distancia estimada de la ruta`} /></View>
      <View style={s.km}><Text style={s.kmNumber}>{trip.ruta.distanciaKm} km</Text><Text style={s.kmText}>Distancia total estimada</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {['Recomendado', 'Más barato', 'Más rápido', 'Confort'].map(item => <Pressable onPress={() => selectFilter(item)} key={item} style={[s.filter, sort === item && s.filterOn]}><Text style={[s.filterText, sort === item && s.filterTextOn]}>{item}</Text></Pressable>)}
      </ScrollView>
      {ordered.map(ride => {
        const index = rides.indexOf(ride);
        return <ServiceCard key={ride.brand} service={ride} selected={chosen === index} onPress={() => setChosen(index)} />;
      })}
    </ScrollView>
    <View style={s.cta}><GradientButton label={saving ? 'Guardando viaje...' : `Elegir ${rides[chosen].brand} · ${rides[chosen].price}`} onPress={confirmarViaje} /></View>
  </View>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingTop: 58, paddingBottom: 110 },
  empty: { flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'center', gap: 28 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  route: { color: C.muted, fontSize: 11, flex: 1 },
  head: { marginTop: 26 },
  km: { marginTop: 20, backgroundColor: 'rgba(20,184,166,.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,.3)', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kmNumber: { color: '#D8FFF4', fontSize: 22, fontWeight: '800' },
  kmText: { color: C.muted, fontSize: 11 },
  filters: { gap: 8, paddingVertical: 18 },
  filter: { paddingHorizontal: 13, height: 34, borderRadius: 17, justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  filterOn: { backgroundColor: 'rgba(20,184,166,.18)', borderColor: 'rgba(52,211,153,.55)' },
  filterText: { color: C.muted, fontSize: 11, fontWeight: '600' },
  filterTextOn: { color: C.green },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 26, backgroundColor: 'rgba(4,26,43,.97)', borderTopWidth: 1, borderColor: C.border },
});
