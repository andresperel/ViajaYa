import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../services/api';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function ResultadosScreen({ navigation, route }) {
  const {
    origenIngresado,
    destinoIngresado,
    usuario,
    datosViaje,
  } = route.params;

  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');
  const opciones = datosViaje?.opciones || [];

  const elegirViaje = async (oferta) => {
    setMensajeEnPantalla('');

    if (!usuario) {
      setMensajeEnPantalla('No se encontró el usuario logueado');
      return;
    }

    try {
      setMensajeEnPantalla('Guardando viaje...');

      await apiFetch('/viaje', {
        method: 'POST',
        body: JSON.stringify({
          calleOrigen: origenIngresado,
          calleDestino: destinoIngresado,
          precioEstimado: oferta.precio,
          tiempoEstimado: oferta.tiempoEstimado,
          idTipoServicio: oferta.idTipoServicio,
        }),
      });

      navigation.navigate('ViajeConfirmado', {
        empresaElegida: oferta.empresa,
        precioElegido: oferta.precio,
        usuario,
      });

    } catch (error) {
      setMensajeEnPantalla('No pude guardar el viaje');
      console.log('Error al guardar viaje:', error);
    }
  };

  const obtenerBadge = (index) => {
    if (index === 0) return '💸 Más barato';
    if (index === 1) return '⚡ Más rápido';
    if (index === 2) return '🏆 Mejor valorado';
    return '';
  };

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >

        <View style={estilos.header}>
          <TouchableOpacity
            style={estilos.botonCircular}
            onPress={() => navigation.navigate('Home', { usuario })}
          >
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View style={estilos.headerTexto}>
            <Text style={estilos.rutaChica} numberOfLines={1}>
              {origenIngresado} → {destinoIngresado}
            </Text>

            <Text style={estilos.tituloHeader} numberOfLines={1}>
              {opciones.length} viajes encontrados · {datosViaje?.distanciaKm} km
            </Text>
          </View>

          <View style={estilos.botonCircular}>
            <Text style={estilos.filtro}>☰</Text>
          </View>
        </View>

        <View style={estilos.mapaCard}>
          <LinearGradient
            colors={['rgba(37,99,235,0.35)', 'rgba(34,197,94,0.22)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={estilos.mapaFondo}
          />

          <View style={estilos.rutaLineaUno} />
          <View style={estilos.rutaLineaDos} />
          <View style={estilos.pinOrigen} />
          <View style={estilos.pinDestino} />

          <View style={estilos.mapaInfo}>
            <Text style={estilos.mapaTitulo}>Ruta calculada con API real</Text>
            <Text style={estilos.mapaTexto} numberOfLines={1}>
              {datosViaje?.distanciaKm} km · {datosViaje?.duracionMin} min aprox.
            </Text>
          </View>
        </View>

        <View style={estilos.lista}>
          {opciones.map((oferta, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.88}
              onPress={() => elegirViaje(oferta)}
            >
              <View style={index === 0 ? estilos.cardDestacada : estilos.cardOferta}>
                <View
                  style={[
                    estilos.logoEmpresa,
                    oferta.empresa === 'Uber' && estilos.logoUber,
                    oferta.empresa === 'Didi' && estilos.logoDidi,
                    oferta.empresa === 'Cabify' && estilos.logoCabify,
                  ]}
                >
                  <Text style={estilos.logoTexto}>
                    {oferta.empresa.charAt(0)}
                  </Text>
                </View>

                <View style={estilos.infoOferta}>
                  <Text style={estilos.nombreEmpresa}>
                    {oferta.empresa}
                    <Text style={estilos.tipoServicio}> · {oferta.tipo}</Text>
                  </Text>

                  <Text style={estilos.detalleTexto}>
                    {oferta.tiempoEstimado} min viaje
                  </Text>

                  {obtenerBadge(index) !== '' && (
                    <View style={estilos.badge}>
                      <Text style={estilos.badgeTexto}>{obtenerBadge(index)}</Text>
                    </View>
                  )}
                </View>

                <View style={estilos.precioBox}>
                  <Text style={estilos.precio}>
                    ${oferta.precio.toLocaleString('es-AR')}
                  </Text>

                  <LinearGradient
                    colors={['#2563EB', '#22C55E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={estilos.botonElegir}
                  >
                    <Text style={estilos.textoElegir}>Elegir</Text>
                  </LinearGradient>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' },
  contenido: { padding: 24, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  botonCircular: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flecha: { color: '#FFFFFF', fontSize: 24 },
  filtro: { color: '#FFFFFF', fontSize: 20 },
  headerTexto: { flex: 1, marginHorizontal: 12 },
  rutaChica: { color: '#9CA3AF', fontSize: 12 },
  tituloHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginTop: 3 },

  mapaCard: {
    marginTop: 18,
    height: 122,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#152A4D',
    position: 'relative',
  },
  mapaFondo: { ...StyleSheet.absoluteFillObject },
  rutaLineaUno: {
    position: 'absolute',
    height: 3,
    width: 250,
    backgroundColor: '#2563EB',
    left: 22,
    top: 82,
    transform: [{ rotate: '-18deg' }],
    borderRadius: 4,
  },
  rutaLineaDos: {
    position: 'absolute',
    height: 3,
    width: 170,
    backgroundColor: '#22C55E',
    right: 16,
    top: 44,
    transform: [{ rotate: '-28deg' }],
    borderRadius: 4,
  },
  pinOrigen: {
    position: 'absolute',
    left: 28,
    bottom: 24,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  pinDestino: {
    position: 'absolute',
    right: 26,
    top: 22,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  mapaInfo: { position: 'absolute', left: 16, bottom: 14 },
  mapaTitulo: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  mapaTexto: { color: '#B8C1CC', fontSize: 11, marginTop: 3 },

  lista: { marginTop: 18 },
  cardOferta: {
    minHeight: 98,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDestacada: {
    minHeight: 98,
    borderRadius: 23,
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    marginBottom: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoEmpresa: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoUber: { backgroundColor: '#000000' },
  logoDidi: { backgroundColor: '#FF7A00' },
  logoCabify: { backgroundColor: '#7B61FF' },
  logoTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  infoOferta: { flex: 1 },
  nombreEmpresa: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  tipoServicio: { color: '#B8C1CC', fontWeight: '400' },
  detalleTexto: { color: '#9CA3AF', fontSize: 11, marginTop: 6 },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 9,
    paddingHorizontal: 9,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
  },
  badgeTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  precioBox: { alignItems: 'flex-end', marginLeft: 10 },
  precio: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  botonElegir: {
    marginTop: 10,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoElegir: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
});