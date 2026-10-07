import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { businessSummary, tripProvider } from '../utils/businessTrips';

export default function BusinessOverview({ state, home = false, period = 'mes' }) {
  if (state.loading) return <Text style={styles.text}>Cargando viajes laborales...</Text>;
  if (state.error) return <View style={styles.card}><Text style={styles.text}>{state.error}</Text><TouchableOpacity onPress={state.retry}><Text style={styles.link}>Reintentar</Text></TouchableOpacity></View>;
  const summary = businessSummary(state.trips, period);
  const latest = home ? businessSummary(state.trips, 'todos').latest : summary.latest;
  if (!summary.totalCount) return <View style={styles.card}><Text style={styles.title}>Todavía no tenés viajes Business</Text><Text style={styles.text}>Compará y guardá tu primer viaje laboral para verlo acá.</Text></View>;
  if (!summary.count && !home) return <View style={styles.card}><Text style={styles.text}>No hay viajes laborales en este período.</Text></View>;
  return <View style={styles.card}>
    <Text style={styles.title}>{home ? 'Costo estimado del mes' : 'Costo estimado del período'}</Text>
    <Text style={styles.amount}>${summary.cost.toLocaleString('es-AR')}</Text>
    <Text style={styles.text}>{period === 'mes' ? 'Este mes' : period === 'anteriores' ? 'Meses anteriores' : 'Todo el historial'} · Precios estimados de viajes guardados</Text>
    <Text style={styles.title}>Viajes laborales guardados: {home ? summary.totalCount : summary.count}</Text>
    {!home && summary.provider && <Text style={styles.text}>Proveedor más seleccionado: {summary.provider}</Text>}
    <Text style={styles.title}>Últimos viajes laborales</Text>
    {!latest.length && <Text style={styles.text}>No hay viajes laborales en este período.</Text>}
    {latest.map((trip) => <View key={trip.idViaje} style={styles.trip}>
      <Text style={styles.title}>{tripProvider(trip)}</Text>
      <Text style={styles.text}>{trip.calleOrigen} → {trip.calleDestino}</Text>
      <Text style={styles.text}>{trip.fechaViaje} · Precio estimado: ${Number(trip.precioEstimado).toLocaleString('es-AR')}</Text>
      {!!trip.motivoViaje && <Text style={styles.text}>Motivo: {trip.motivoViaje}</Text>}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 18, backgroundColor: '#142746', borderColor: '#2563EB', borderWidth: 1, borderRadius: 22, padding: 18 },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 10 },
  text: { color: '#B8C1CC', marginTop: 8, lineHeight: 20 },
  amount: { color: '#7DD3FC', fontSize: 26, fontWeight: '800', marginTop: 8 },
  link: { color: '#7DD3FC', paddingVertical: 12 },
  trip: { borderTopWidth: 1, borderColor: '#274366', marginTop: 12, paddingTop: 4 },
});
