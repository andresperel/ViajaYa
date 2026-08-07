import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../services/api';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

export default function ViajeConfirmadoScreen({ navigation, route }) {
  const {
    empresaElegida,
    precioElegido,
    ofertaElegida,
    viaje,
    origenIngresado,
    destinoIngresado,
    origenCoordenadas,
    destinoCoordenadas,
    usuario,
  } = route.params;

  const [estadoVerificacion, setEstadoVerificacion] = useState('Verificando viaje guardado...');
  const [estadoApertura, setEstadoApertura] = useState('');

  useEffect(() => {
    let activo = true;
    if (!viaje?.idViaje) {
      setEstadoVerificacion('No se recibio el identificador del viaje');
      return undefined;
    }

    apiFetch(`/viaje/${viaje.idViaje}/verificar`)
      .then((respuesta) => {
        if (activo && respuesta.verificado) {
          setEstadoVerificacion(`Viaje verificado · ID ${viaje.idViaje}`);
        }
      })
      .catch((error) => {
        if (activo) setEstadoVerificacion(error.message || 'No se pudo verificar el viaje');
      });

    return () => { activo = false; };
  }, [viaje?.idViaje]);

  const abrirConFallback = async (urlAplicacion, urlFallback) => {
    try {
      await Linking.openURL(urlAplicacion);
    } catch (error) {
      try {
        await Linking.openURL(urlFallback);
      } catch (fallbackError) {
        setEstadoApertura('No se pudo abrir la aplicacion en este dispositivo');
      }
    }
  };

  const copiarDestinoYAbrir = async (urlAplicacion, urlFallback) => {
    await Clipboard.setStringAsync(destinoIngresado || '');
    setEstadoApertura('Destino copiado. Pegalo en el campo de destino.');
    Alert.alert(
      'Destino copiado',
      `Al abrir ${empresaElegida}, mantené presionado el campo de destino y elegí Pegar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Abrir ${empresaElegida}`,
          onPress: () => abrirConFallback(urlAplicacion, urlFallback),
        },
      ]
    );
  };

  const abrirAplicacionDeViaje = async () => {
    setEstadoApertura(`Abriendo ${empresaElegida}...`);

    if (empresaElegida === 'Uber') {
      const params = new URLSearchParams({
        action: 'setPickup',
        'pickup[formatted_address]': origenIngresado || '',
        'dropoff[formatted_address]': destinoIngresado || '',
      });
      if (Array.isArray(origenCoordenadas)) {
        params.set('pickup[longitude]', String(origenCoordenadas[0]));
        params.set('pickup[latitude]', String(origenCoordenadas[1]));
      }
      if (Array.isArray(destinoCoordenadas)) {
        params.set('dropoff[longitude]', String(destinoCoordenadas[0]));
        params.set('dropoff[latitude]', String(destinoCoordenadas[1]));
      }
      await abrirConFallback(
        `https://m.uber.com/ul/?${params.toString()}`,
        'https://play.google.com/store/apps/details?id=com.ubercab'
      );
      return;
    }

    if (empresaElegida === 'Cabify') {
      const tiendaCabify = 'https://play.google.com/store/apps/details?id=com.cabify.rider';
      const enlaceCabify = Platform.OS === 'android'
        ? `intent://#Intent;scheme=cabify;package=com.cabify.rider;S.browser_fallback_url=${encodeURIComponent(tiendaCabify)};end`
        : 'cabify://';
      await copiarDestinoYAbrir(enlaceCabify, tiendaCabify);
      return;
    }

    if (empresaElegida === 'Didi' || empresaElegida === 'DiDi') {
      const tiendaDidi = 'https://play.google.com/store/apps/details?id=com.didiglobal.passenger';
      const enlaceDidi = Platform.OS === 'android'
        ? `intent:#Intent;component=com.didiglobal.passenger/com.didi.sdk.app.DidiLoadDexActivity;S.browser_fallback_url=${encodeURIComponent(tiendaDidi)};end`
        : 'didi://';
      await copiarDestinoYAbrir(enlaceDidi, tiendaDidi);
      return;
    }
  };

  const obtenerColorEmpresa = () => {
    if (empresaElegida === 'Uber') return '#000000';
    if (empresaElegida === 'Didi' || empresaElegida === 'DiDi') return '#FF7A00';
    if (empresaElegida === 'Cabify') return '#7B61FF';
    return '#2563EB';
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
            onPress={() => navigation.goBack()}
          >
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <Text style={estilos.headerTitulo}>Confirmar viaje</Text>
        </View>

        <View style={estilos.mapaCard}>
          <LinearGradient
            colors={['rgba(37,99,235,0.35)', 'rgba(34,197,94,0.24)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={estilos.mapaFondo}
          />

          <View style={estilos.rutaLineaUno} />
          <View style={estilos.rutaLineaDos} />

          <View style={estilos.pinOrigen} />
          <View style={estilos.pinDestino} />

          <View style={estilos.llegadaBox}>
            <Text style={estilos.llegadaTexto}>🕒 Llegada estimada</Text>
            <Text style={estilos.llegadaHora}>19:42</Text>
          </View>
        </View>

        <View style={estilos.rutaCard}>
          <Stop label="Origen" value={origenIngresado || 'Ubicacion seleccionada'} tipo="origen" />
          <View style={estilos.lineaStop} />
          <Stop label="Destino" value={destinoIngresado || 'Destino seleccionado'} tipo="destino" />
        </View>

        <View style={estilos.resumenCard}>
          <View
            style={[
              estilos.logoEmpresa,
              { backgroundColor: obtenerColorEmpresa() },
            ]}
          >
            <Text style={estilos.logoTexto}>
              {empresaElegida?.charAt(0)}
            </Text>
          </View>

          <View style={estilos.infoViaje}>
            <Text style={estilos.empresaTexto}>
              {empresaElegida} · Viaje elegido
            </Text>

            <Text style={estilos.detalleTexto}>
              {ofertaElegida?.llegadaMin || 3} min de llegada · {ofertaElegida?.duracionMin || viaje?.tiempoEstimado} min de viaje
            </Text>
          </View>

          <View style={estilos.precioBox}>
            <Text style={estilos.precio}>
              ${Number(precioElegido || 0).toLocaleString('es-AR')}
            </Text>
            <Text style={estilos.ars}>ARS</Text>
          </View>
        </View>

        <View style={estilos.pagoCard}>
          <View style={estilos.iconoPagoBox}>
            <Text style={estilos.iconoPago}>💳</Text>
          </View>

          <View style={estilos.pagoTexto}>
            <Text style={estilos.pagoTitulo}>Mastercard •••• 4242</Text>
            <Text style={estilos.pagoSubtitulo}>Método de pago</Text>
          </View>

          <Text style={estilos.chevron}>›</Text>
        </View>

        <View style={estilos.seguridadCard}>
          <Text style={estilos.escudo}>🛡️</Text>
          <Text style={estilos.seguridadTexto}>
            Precio estimado. Continuá en la app para finalizar el viaje.
          </Text>
        </View>

        <View style={estilos.verificacionCard}>
          <Text style={estilos.verificacionIcono}>✓</Text>
          <View style={estilos.verificacionTextoBox}>
            <Text style={estilos.verificacionTitulo}>Registro del viaje</Text>
            <Text style={estilos.verificacionDetalle}>{estadoVerificacion}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={abrirAplicacionDeViaje}
          activeOpacity={0.85}
          style={estilos.ctaWrapper}
        >
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.botonPrincipal}
          >
            <Text style={estilos.textoBotonPrincipal}>
              Continuar en {empresaElegida} ›
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {estadoApertura !== '' && (
          <Text style={estilos.estadoApertura}>{estadoApertura}</Text>
        )}

        <TouchableOpacity
          style={estilos.botonSecundario}
          onPress={() => navigation.navigate('Home', {
            usuario,
            notificaciones: [{
              id: Date.now(),
              titulo: 'Viaje guardado',
              texto: `Tu viaje con ${empresaElegida} quedo guardado en Mis viajes.`,
            }],
          })}
        >
          <Text style={estilos.textoBotonSecundario}>Volver al inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('MisViajes', { usuario })}
        >
          <Text style={estilos.linkViajes}>Ver mis viajes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function Stop({ label, value, tipo }) {
  return (
    <View style={estilos.stopBox}>
      <View
        style={[
          estilos.stopDot,
          tipo === 'destino' && estilos.stopDotDestino,
        ]}
      />

      <View style={estilos.stopTextoBox}>
        <Text style={estilos.stopLabel}>{label}</Text>
        <Text style={estilos.stopValue} numberOfLines={1}>{value}</Text>
      </View>

      <Text style={estilos.mapPin}>📍</Text>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  botonCircular: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  flecha: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  headerTitulo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  mapaCard: {
    marginTop: 18,
    height: 170,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#152A4D',
    position: 'relative',
  },

  mapaFondo: {
    ...StyleSheet.absoluteFillObject,
  },

  rutaLineaUno: {
    position: 'absolute',
    height: 4,
    width: 330,
    backgroundColor: '#2563EB',
    left: 24,
    top: 116,
    transform: [{ rotate: '-20deg' }],
    borderRadius: 4,
  },

  rutaLineaDos: {
    position: 'absolute',
    height: 4,
    width: 200,
    backgroundColor: '#22C55E',
    right: 12,
    top: 54,
    transform: [{ rotate: '-23deg' }],
    borderRadius: 4,
  },

  pinOrigen: {
    position: 'absolute',
    left: 28,
    bottom: 34,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  pinDestino: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 4,
    borderColor: 'rgba(34,197,94,0.25)',
  },

  llegadaBox: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  llegadaTexto: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },

  llegadaHora: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  rutaCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  stopBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },

  stopDotDestino: {
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },

  stopTextoBox: {
    flex: 1,
  },

  stopLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  stopValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },

  mapPin: {
    fontSize: 14,
  },

  lineaStop: {
    marginLeft: 5,
    height: 22,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },

  resumenCard: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoEmpresa: {
    width: 56,
    height: 56,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  logoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  infoViaje: {
    flex: 1,
  },

  empresaTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  detalleTexto: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 5,
  },

  precioBox: {
    alignItems: 'flex-end',
  },

  precio: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  ars: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  pagoCard: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoPagoBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(37,99,235,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconoPago: {
    fontSize: 18,
  },

  pagoTexto: {
    flex: 1,
  },

  pagoTitulo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  pagoSubtitulo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  chevron: {
    color: '#94A3B8',
    fontSize: 28,
  },

  seguridadCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  escudo: {
    fontSize: 17,
    marginRight: 10,
  },

  seguridadTexto: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
  },

  verificacionCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  verificacionIcono: {
    width: 30,
    height: 30,
    borderRadius: 15,
    color: '#FFFFFF',
    backgroundColor: '#22C55E',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '900',
    marginRight: 10,
  },

  verificacionTextoBox: { flex: 1 },
  verificacionTitulo: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  verificacionDetalle: { color: '#86EFAC', fontSize: 11, marginTop: 3 },

  ctaWrapper: {
    marginTop: 24,
  },

  botonPrincipal: {
    height: 58,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  estadoApertura: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 8,
  },

  botonSecundario: {
    marginTop: 12,
    height: 52,
    borderRadius: 18,
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

  linkViajes: {
    marginTop: 18,
    color: '#22C55E',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
  },
});
