import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';

export default function PrivacidadScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  const { idioma } = useApp();
  const ingles = idioma === 'en';

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.volver} onPress={() => navigation.goBack()}><Text style={estilos.flecha}>←</Text></TouchableOpacity>
          <View style={estilos.headerTexto}>
            <Text style={estilos.titulo}>{ingles ? 'Privacy and security' : 'Privacidad y seguridad'}</Text>
            <Text style={estilos.subtitulo}>{ingles ? 'Your data and permissions' : 'Tus datos y permisos'}</Text>
          </View>
        </View>

        <Seccion icono="👤" titulo={ingles ? 'Account data' : 'Datos de la cuenta'} texto={ingles ? `Name and email associated with ${usuario?.email || 'your account'}. Passwords are never displayed.` : `Nombre y correo asociados a ${usuario?.email || 'tu cuenta'}. Las contraseñas nunca se muestran.`} />
        <Seccion icono="📍" titulo={ingles ? 'Location data' : 'Datos de ubicación'} texto={ingles ? 'ViajaYa uses the origin and destination you enter to calculate and compare routes. It does not track you in the background.' : 'ViajaYa usa el origen y destino que ingresás para calcular y comparar rutas. No rastrea tu ubicación en segundo plano.'} />
        <Seccion icono="🔐" titulo={ingles ? 'Session security' : 'Seguridad de la sesión'} texto={ingles ? 'Private endpoints require your active session token. Each user can only access their own trips.' : 'Los endpoints privados requieren tu sesión activa. Cada usuario solamente puede acceder a sus propios viajes.'} />

        <TouchableOpacity style={estilos.accion} onPress={() => navigation.navigate('MisViajes', { usuario })}>
          <Text style={estilos.accionIcono}>🚗</Text><View style={estilos.accionTexto}><Text style={estilos.accionTitulo}>{ingles ? 'Review my stored trips' : 'Revisar mis viajes guardados'}</Text><Text style={estilos.accionSubtitulo}>{ingles ? 'See pending, completed and cancelled trips' : 'Ver viajes pendientes, realizados y cancelados'}</Text></View><Text style={estilos.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.cerrar} onPress={() => navigation.navigate('Welcome')}><Text style={estilos.cerrarTexto}>{ingles ? 'Sign out on this device' : 'Cerrar sesión en este dispositivo'}</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Seccion({ icono, titulo, texto }) {
  return <View style={estilos.card}><Text style={estilos.cardIcono}>{icono}</Text><View style={estilos.cardTexto}><Text style={estilos.cardTitulo}>{titulo}</Text><Text style={estilos.cardDetalle}>{texto}</Text></View></View>;
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' }, contenido: { padding: 24, paddingBottom: 40 }, header: { marginTop: 8, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTexto: { flex: 1 },
  volver: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }, flecha: { color: '#FFF', fontSize: 24 }, titulo: { color: '#FFF', fontSize: 23, fontWeight: '900' }, subtitulo: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  card: { borderRadius: 20, padding: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', flexDirection: 'row' }, cardIcono: { fontSize: 20, marginRight: 13 }, cardTexto: { flex: 1 }, cardTitulo: { color: '#FFF', fontSize: 14, fontWeight: '900' }, cardDetalle: { color: '#B8C1CC', fontSize: 12, lineHeight: 19, marginTop: 6 },
  accion: { marginTop: 8, borderRadius: 20, padding: 16, backgroundColor: 'rgba(37,99,235,0.16)', flexDirection: 'row', alignItems: 'center' }, accionIcono: { fontSize: 20, marginRight: 12 }, accionTexto: { flex: 1 }, accionTitulo: { color: '#FFF', fontSize: 14, fontWeight: '900' }, accionSubtitulo: { color: '#94A3B8', fontSize: 11, marginTop: 4 }, chevron: { color: '#94A3B8', fontSize: 27 },
  cerrar: { height: 52, borderRadius: 18, marginTop: 18, borderWidth: 1, borderColor: 'rgba(248,113,113,0.30)', justifyContent: 'center', alignItems: 'center' }, cerrarTexto: { color: '#F87171', fontSize: 14, fontWeight: '900' },
});
