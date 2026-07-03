import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={estilos.fondo}>
      <View style={estilos.pantallaMobile}>

        <View style={estilos.header}>
          <Image
            source={require('../assets/logo-viajaya.png')}
            style={estilos.logoImagen}
            resizeMode="contain"
          />

          <View style={estilos.versionBox}>
            <Text style={estilos.versionTexto}>✨ v2.0</Text>
          </View>
        </View>

        <View style={estilos.heroCard}>
          <LinearGradient
            colors={['rgba(37,99,235,0.32)', 'rgba(34,197,94,0.22)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={estilos.heroFondo}
          />

          <View style={estilos.cuadricula} />

          <View style={estilos.rutaUno} />
          <View style={estilos.rutaDos} />

          <View style={estilos.puntoOrigen} />
          <View style={estilos.puntoDestino} />

          <View style={estilos.tarjetaPrecio}>
            <Text style={estilos.labelPrecio}>MEJOR PRECIO HOY</Text>

            <View style={estilos.precioFila}>
              <View>
                <Text style={estilos.precio}>
                  $3.450 <Text style={estilos.tiempo}>· 12 min</Text>
                </Text>

                <Text style={estilos.proveedor}>
                  Uber · UberX
                </Text>
              </View>

              <LinearGradient
                colors={['#2563EB', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={estilos.botonFlecha}
              >
                <Text style={estilos.flecha}>↗</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={estilos.bottom}>
          <Text style={estilos.titulo}>
            Movete <Text style={estilos.tituloGradiente}>mejor</Text>.
          </Text>

          <Text style={estilos.subtitulo}>
            Compará Uber, Didi y Cabify en una sola búsqueda.
          </Text>

          <View style={estilos.zonaBotones}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Register')}
            >
              <LinearGradient
                colors={['#2563EB', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={estilos.botonPrincipal}
              >
                <Text style={estilos.textoBotonPrincipal}>
                  Comenzar
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonSecundario}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={estilos.textoBotonSecundario}>
                Ya tengo cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#0F1F3A',
    alignItems: 'center',
  },

  pantallaMobile: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#0F1F3A',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 34,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logoImagen: {
    width: 128,
    height: 46,
  },

  versionBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  versionTexto: {
    color: '#B8C1CC',
    fontSize: 11,
    fontWeight: '700',
  },

  heroCard: {
    flex: 1,
    marginTop: 38,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#152A4D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
    minHeight: 360,
  },

  heroFondo: {
    ...StyleSheet.absoluteFillObject,
  },

  cuadricula: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  rutaUno: {
    position: 'absolute',
    width: 390,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    transform: [{ rotate: '-39deg' }],
    left: -42,
    bottom: 146,
  },

  rutaDos: {
    position: 'absolute',
    width: 270,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    transform: [{ rotate: '-45deg' }],
    right: -32,
    top: 106,
  },

  puntoOrigen: {
    position: 'absolute',
    left: 38,
    bottom: 92,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  puntoDestino: {
    position: 'absolute',
    right: 32,
    top: 42,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 4,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  tarjetaPrecio: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  labelPrecio: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  precioFila: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  precio: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  tiempo: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },

  proveedor: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
  },

  botonFlecha: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flecha: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  bottom: {
    paddingTop: 32,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },

  tituloGradiente: {
    color: '#22C55E',
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 310,
  },

  zonaBotones: {
    marginTop: 28,
    gap: 12,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  botonSecundario: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  textoBotonSecundario: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});