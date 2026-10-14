import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import BusinessBadge from '../components/BusinessBadge';
import BusinessOverview from '../components/BusinessOverview';
import useBusinessTrips from '../hooks/useBusinessTrips';

export default function DashboardBusinessScreen({ navigation, route }) {
  const { modoViajaYa } = useApp();
  const [period, setPeriod] = useState('mes');
  const state = useBusinessTrips(modoViajaYa === 'business', route?.params?.usuario?.idUsuario);
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.link}>← Volver</Text></TouchableOpacity>
    <Text style={styles.title}>ViajaYa Business</Text>
    {modoViajaYa === 'business' ? <>
      <BusinessBadge />
      <View style={styles.periods}>{[['mes', 'Este mes'], ['todos', 'Todo el historial'], ['anteriores', 'Anteriores']].map(([id, label]) => <TouchableOpacity key={id} onPress={() => setPeriod(id)} style={[styles.chip, id === period && styles.selected]}><Text style={styles.text}>{label}</Text></TouchableOpacity>)}</View>
      <BusinessOverview state={state} period={period} />
    </> : <Text style={styles.text}>Ingresá el código de tu empresa desde Perfil para acceder a Business.</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' }, content: { padding: 24, paddingBottom: 40 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 16 },
  link: { color: '#7DD3FC', paddingVertical: 10 }, text: { color: '#FFFFFF' },
  periods: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { backgroundColor: '#142746', padding: 12, borderRadius: 18 }, selected: { backgroundColor: '#2563EB' },
});
