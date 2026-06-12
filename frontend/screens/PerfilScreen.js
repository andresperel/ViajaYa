import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

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

  if (!usuario) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.contenido}>
          <Text style={estilos.titulo}>Perfil</Text>

          <View style={estilos.cardPerfil}>
            <Text style={estilos.nombre}>No pude cargar los datos</Text>
            <Text style={estilos.email}>Volvé a iniciar sesión para ver tu perfil.</Text>
          </View>

          <TouchableOpacity
            style={estilos.botonSecundario}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={estilos.textoBotonSecundario}>Volver al login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >
        <View style={estilos.header}>
          <Text style={estilos.titulo}>Perfil</Text>
        </View>

        <View style={estilos.cardPerfil}>
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.avatar}
          >
            <Text style={estilos.inicial}>
              {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
            </Text>
          </LinearGradient>

          <View style={estilos.infoUsuario}>
            <Text style={estilos.nombre} numberOfLines={1}>
              {usuario.nombre}
            </Text>

            <Text style={estilos.email} numberOfLines={1}>
              {usuario.email}
            </Text>

            <View style={estilos.premiumBox}>
              <Text style={estilos.premiumTexto}>⭐ 4,96 · Premium</Text>
            </View>
          </View>
        </View>

        <View style={estilos.statsGrid}>
          <Stat value="48" label="Viajes" />
          <Stat value="$182k" label="Ahorrado" />
          <Stat value="12" label="Meses" />
        </View>

        <View style={estilos.lista}>
          <Item icono="💳" titulo="Métodos de pago" subtitulo="Mastercard •••• 4242" />
          <Item icono="🔔" titulo="Notificaciones" subtitulo="Promos y avisos" />
          <Item icono="🛡️" titulo="Privacidad y seguridad" subtitulo="Datos y permisos" />
          <Item icono="⚙️" titulo="Preferencias" subtitulo="Idioma, moneda" />
          <Item icono="❔" titulo="Ayuda" subtitulo="Centro de ayuda y soporte" />
        </View>

        <TouchableOpacity
          style={estilos.botonSecundario}
          onPress={() => navigation.navigate('Home', { usuario })}
        >
          <Text style={estilos.textoBotonSecundario}>Volver al inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonCerrar}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={estilos.textoCerrar}>↩ Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={estilos.version}>
          ViajaYA v2.0 · Buenos Aires, AR
        </Text>
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

function Item({ icono, titulo, subtitulo }) {
  return (
    <TouchableOpacity style={estilos.item} activeOpacity={0.85}>
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
  container: {
    flex: 1,
    backgroundColor: '#0F1F3A',
  },

  contenido: {
    padding: 24,
    paddingBottom: 40,
  },

  header: {
    marginTop: 8,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

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

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  inicial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  infoUsuario: {
    flex: 1,
  },

  nombre: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  email: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },

  premiumBox: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  premiumTexto: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '900',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    alignItems: 'center',
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  lista: {
    marginTop: 20,
    gap: 10,
  },

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

  itemIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(37,99,235,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  itemIcon: {
    fontSize: 18,
  },

  itemTexto: {
    flex: 1,
  },

  itemTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  itemSubtitulo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  chevron: {
    color: '#94A3B8',
    fontSize: 26,
  },

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

  textoBotonSecundario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

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

  textoCerrar: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '800',
  },

  version: {
    marginTop: 14,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 10,
  },
});