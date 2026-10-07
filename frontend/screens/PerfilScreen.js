import React, { useCallback, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getMyTripStats } from '../services/api';
import { useApp } from '../context/AppContext';
import BusinessBadge from '../components/BusinessBadge';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function PerfilScreen({ navigation, route }) {
  const usuario = route.params?.usuario;
  const { idioma, modoViajaYa, cambiarModoViajaYa } = useApp();
  const business = modoViajaYa === 'business';
  const ingles = idioma === 'en';
  const [cantidadViajes, setCantidadViajes] = useState(0);
  const [totalGastado, setTotalGastado] = useState(0);

  useFocusEffect(useCallback(() => {
    cargarStats();
  }, []));

  const cargarStats = async () => {
    try {
      const stats = await getMyTripStats();
      setCantidadViajes(Number(stats.cantidad || 0));
      setTotalGastado(Number(stats.totalGastado || 0));
    } catch (error) {
      setCantidadViajes(0);
      setTotalGastado(0);
      console.log('Error al cargar stats de perfil:', error);
    }
  };

  if (!usuario) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.contenido}>
          <Text style={estilos.titulo}>{ingles ? 'Profile' : 'Perfil'}</Text>

          <View style={estilos.cardPerfil}>
            <Text style={estilos.nombre}>No pude cargar los datos</Text>
            <Text style={estilos.email}>Volve a iniciar sesion para ver tu perfil.</Text>
          </View>

          <TouchableOpacity style={estilos.botonSecundario} onPress={() => navigation.navigate('Login')}>
            <Text style={estilos.textoBotonSecundario}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <Text style={estilos.titulo}>Perfil</Text>
        </View>

        <View style={estilos.cardPerfil}>
          <LinearGradient
            colors={business ? ['#142D50', '#2563EB'] : ['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.avatar}
          >
            <Text style={estilos.inicial}>
              {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
            </Text>
          </LinearGradient>

          <View style={estilos.infoUsuario}>
            <Text style={estilos.nombre} numberOfLines={1}>{usuario.nombre}</Text>
            <Text style={estilos.email} numberOfLines={1}>{usuario.email}</Text>
            <View style={estilos.estadoBox}>
              <Text style={estilos.estadoTexto}>{ingles ? 'Active account' : 'Cuenta activa'}</Text>
            </View>
          </View>
        </View>

        {!business && <View style={estilos.statsGrid}>
          <Stat value={String(cantidadViajes)} label={ingles ? 'Trips' : 'Viajes'} />
          <Stat value={`$${totalGastado.toLocaleString('es-AR')}`} label={ingles ? 'Spent' : 'Gastado'} />
          <Stat value={cantidadViajes > 0 ? (ingles ? 'Active' : 'Activo') : (ingles ? 'New' : 'Nuevo')} label={ingles ? 'Status' : 'Estado'} />
        </View>}

        <View style={[estilos.lista, { padding: 18, borderRadius: 22, backgroundColor: '#142746' }]}>
          <Text style={estilos.nombre}>ViajaYa Business</Text>
          <Text style={estilos.email}>Gestioná tus viajes laborales de forma simple.</Text>
          {business && <><BusinessBadge /><Text style={estilos.nombre}>Modo Business activo</Text></>}
          <TouchableOpacity style={estilos.botonSecundario} onPress={() => cambiarModoViajaYa(business ? 'personal' : 'business')}>
            <Text style={estilos.textoBotonSecundario}>{business ? 'Volver a ViajaYa Personal' : 'Cambiar a Business'}</Text>
          </TouchableOpacity>
          {business && <TouchableOpacity style={estilos.botonSecundario} onPress={() => navigation.navigate('DashboardBusiness', { usuario })}><Text style={estilos.textoBotonSecundario}>Dashboard Business</Text></TouchableOpacity>}
        </View>

        <View style={estilos.lista}>
          <Item icono="🔔" titulo={ingles ? 'Notifications' : 'Notificaciones'} subtitulo={ingles ? 'Offers and alerts' : 'Promos y avisos'} onPress={() => navigation.navigate('Notificaciones', { usuario })} />
          <Item icono="🌐" titulo={ingles ? 'Language' : 'Idioma'} subtitulo={idioma === 'en' ? 'English' : 'Español'} onPress={() => navigation.navigate('Idioma')} />
          <Item icono="🛡️" titulo={ingles ? 'Privacy and security' : 'Privacidad y seguridad'} subtitulo={ingles ? 'Data and permissions' : 'Datos y permisos'} onPress={() => navigation.navigate('Privacidad', { usuario })} />
          <Item icono="?" titulo={ingles ? 'Help' : 'Ayuda'} subtitulo={ingles ? 'Help center and support' : 'Centro de ayuda y soporte'} onPress={() => navigation.navigate('Ayuda')} />
        </View>

        <TouchableOpacity style={estilos.botonSecundario} onPress={() => navigation.navigate('Home', { usuario })}>
          <Text style={estilos.textoBotonSecundario}>{ingles ? 'Back to home' : 'Volver al inicio'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.botonCerrar} onPress={() => navigation.navigate('Welcome')}>
          <Text style={estilos.textoCerrar}>{ingles ? 'Sign out' : 'Cerrar sesion'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={estilos.statCard}>
      <Text style={estilos.statValue}>{value}</Text>
      <Text style={estilos.statLabel}>{label}</Text>
    </View>
  );
}

function Item({ icono, titulo, subtitulo, onPress }) {
  return (
    <TouchableOpacity style={estilos.item} activeOpacity={0.85} onPress={onPress}>
      <View style={estilos.itemIconBox}>
        <Text style={estilos.itemIcon}>{icono}</Text>
      </View>

      <View style={estilos.itemTexto}>
        <Text style={estilos.itemTitulo}>{titulo}</Text>
        <Text style={estilos.itemSubtitulo}>{subtitulo}</Text>
      </View>

      <Text style={estilos.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' },
  contenido: { padding: 24, paddingBottom: 40 },
  header: { marginTop: 8 },
  titulo: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  cardPerfil: {
    marginTop: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 66, height: 66, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  inicial: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  infoUsuario: { flex: 1 },
  nombre: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  email: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  estadoBox: { alignSelf: 'flex-start', marginTop: 8 },
  estadoTexto: { color: '#22C55E', fontSize: 11, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  statLabel: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  lista: { marginTop: 20, gap: 10 },
  item: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBox: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(37,99,235,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemIcon: { fontSize: 18 },
  itemTexto: { flex: 1 },
  itemTitulo: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  itemSubtitulo: { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  chevron: { color: '#94A3B8', fontSize: 26 },
  botonSecundario: {
    height: 52,
    borderRadius: 18,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonSecundario: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  botonCerrar: {
    height: 52,
    borderRadius: 18,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCerrar: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
});
