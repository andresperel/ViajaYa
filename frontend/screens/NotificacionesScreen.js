import React from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function NotificacionesScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  const notificaciones = route?.params?.notificaciones || [];

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navigation.navigate('Home', { usuario, notificaciones })}>
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={estilos.titulo}>Notificaciones</Text>
            <Text style={estilos.subtitulo}>Avisos, promociones y estado de tus viajes</Text>
          </View>
        </View>

        {notificaciones.length === 0 ? (
          <View style={estilos.emptyBox}>
            <Text style={estilos.emptyIcon}>🔔</Text>
            <Text style={estilos.emptyTitulo}>No tenes notificaciones</Text>
            <Text style={estilos.emptyTexto}>
              Cuando haya promociones, novedades o cambios en un viaje, van a aparecer aca.
            </Text>
          </View>
        ) : (
          <View style={estilos.lista}>
            {notificaciones.map((item, index) => (
              <View key={item.id || index} style={estilos.card}>
                <Text style={estilos.cardTitulo}>{item.titulo}</Text>
                <Text style={estilos.cardTexto}>{item.texto}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1F3A',
  },

  contenido: {
    flex: 1,
    padding: 24,
  },

  header: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  flecha: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 14,
  },

  emptyTitulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  emptyTexto: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 8,
  },

  lista: {
    marginTop: 24,
  },

  card: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    marginBottom: 12,
  },

  cardTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  cardTexto: {
    color: '#B8C1CC',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
});
