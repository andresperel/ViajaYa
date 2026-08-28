import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';

export default function IdiomaScreen({ navigation }) {
  const { idioma, setIdioma } = useApp();
  const ingles = idioma === 'en';
  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.volver} onPress={() => navigation.goBack()}><Text style={estilos.flecha}>←</Text></TouchableOpacity>
          <View><Text style={estilos.titulo}>{ingles ? 'Language' : 'Idioma'}</Text><Text style={estilos.subtitulo}>{ingles ? 'Choose the app language' : 'Elegí el idioma de la app'}</Text></View>
        </View>
        <Opcion label="Español" activa={idioma === 'es'} onPress={() => setIdioma('es')} />
        <Opcion label="English" activa={idioma === 'en'} onPress={() => setIdioma('en')} />
      </View>
    </SafeAreaView>
  );
}

function Opcion({ label, activa, onPress }) {
  return <TouchableOpacity style={[estilos.opcion, activa && estilos.opcionActiva]} onPress={onPress}><Text style={estilos.opcionTexto}>{label}</Text><Text style={estilos.check}>{activa ? '✓' : ''}</Text></TouchableOpacity>;
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' }, contenido: { padding: 24 },
  header: { marginTop: 8, marginBottom: 26, flexDirection: 'row', alignItems: 'center', gap: 14 },
  volver: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  flecha: { color: '#FFF', fontSize: 24 }, titulo: { color: '#FFF', fontSize: 26, fontWeight: '900' }, subtitulo: { color: '#94A3B8', marginTop: 3 },
  opcion: { height: 66, borderRadius: 20, paddingHorizontal: 18, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opcionActiva: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.12)' }, opcionTexto: { color: '#FFF', fontSize: 16, fontWeight: '800' }, check: { color: '#22C55E', fontSize: 20, fontWeight: '900' },
});
