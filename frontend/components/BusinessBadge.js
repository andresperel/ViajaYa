import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function BusinessBadge() {
  const { empresa } = useApp();
  return <Text style={styles.badge}>BUSINESS{empresa ? ` · ${empresa.nombre}` : ''}</Text>;
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', color: '#7DD3FC', backgroundColor: '#142D50', borderColor: '#2563EB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontWeight: '800', fontSize: 11, letterSpacing: 1, marginVertical: 8 },
});
