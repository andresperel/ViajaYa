import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';

const FAQ = [
  ['¿ViajaYa cobra el viaje?', 'No. ViajaYa compara opciones y te deriva a la app elegida para completar la solicitud.'],
  ['¿Los precios son finales?', 'Son estimaciones. El valor definitivo es el que muestra Uber, DiDi o Cabify al confirmar.'],
  ['¿Cómo confirmo un viaje?', 'Entrá en Mis viajes y respondé Sí o No en el viaje pendiente.'],
  ['¿Por qué no abre una app?', 'Comprobá que esté instalada. Si no, ViajaYa abre su página en la tienda.'],
];

export default function AyudaScreen({ navigation }) {
  const { idioma } = useApp();
  const [abierta, setAbierta] = useState(null);
  const ingles = idioma === 'en';
  return (
    <SafeAreaView style={estilos.container}><ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.header}><TouchableOpacity style={estilos.volver} onPress={() => navigation.goBack()}><Text style={estilos.flecha}>←</Text></TouchableOpacity><View><Text style={estilos.titulo}>{ingles ? 'Help center' : 'Centro de ayuda'}</Text><Text style={estilos.subtitulo}>{ingles ? 'Common questions and support' : 'Preguntas frecuentes y soporte'}</Text></View></View>
      {FAQ.map(([pregunta, respuesta], index) => <TouchableOpacity key={pregunta} style={estilos.card} onPress={() => setAbierta(abierta === index ? null : index)}><View style={estilos.fila}><Text style={estilos.pregunta}>{pregunta}</Text><Text style={estilos.mas}>{abierta === index ? '−' : '+'}</Text></View>{abierta === index && <Text style={estilos.respuesta}>{respuesta}</Text>}</TouchableOpacity>)}
      <View style={estilos.soporte}><Text style={estilos.soporteTitulo}>{ingles ? 'Need more help?' : '¿Necesitás más ayuda?'}</Text><Text style={estilos.soporteTexto}>{ingles ? 'Describe the issue to the ViajaYa team and include your trip ID when applicable.' : 'Describí el problema al equipo de ViajaYa e incluí el ID del viaje cuando corresponda.'}</Text></View>
    </ScrollView></SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' }, contenido: { padding: 24, paddingBottom: 40 }, header: { marginTop: 8, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14 },
  volver: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }, flecha: { color: '#FFF', fontSize: 24 }, titulo: { color: '#FFF', fontSize: 25, fontWeight: '900' }, subtitulo: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  card: { borderRadius: 18, padding: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }, fila: { flexDirection: 'row', alignItems: 'center' }, pregunta: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '800' }, mas: { color: '#22C55E', fontSize: 22 }, respuesta: { color: '#B8C1CC', fontSize: 12, lineHeight: 19, marginTop: 12 },
  soporte: { marginTop: 12, borderRadius: 20, padding: 18, backgroundColor: 'rgba(37,99,235,0.16)' }, soporteTitulo: { color: '#FFF', fontSize: 15, fontWeight: '900' }, soporteTexto: { color: '#B8C1CC', fontSize: 12, lineHeight: 19, marginTop: 6 },
});
