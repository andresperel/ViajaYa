import React, { useMemo, useState } from 'react';
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

const FILTROS = [
  { id: 'barato', label: 'Mas barata' },
  { id: 'rapido', label: 'Mas rapida' },
  { id: 'recomendado', label: 'Recomendada' },
];

export default function ResultadosScreen({ navigation, route }) {
  const {
    origenIngresado,
    destinoIngresado,
    usuario,
    datosViaje,
  } = route.params;

  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('barato');
  const opciones = datosViaje?.opciones || [];
  const ruta = datosViaje?.ruta || {};

  const opcionesOrdenadas = useMemo(() => {
    const copia = [...opciones];

    if (filtroActivo === 'barato') {
      return copia.sort((a, b) => a.precio - b.precio);
    }
    if (filtroActivo === 'rapido') {
      return copia.sort((a, b) => (a.duracionMin || 999) - (b.duracionMin || 999));
    }
    return copia.sort((a, b) => {
      const scoreA = (a.rating || 0) + (a.confort || 0) - (a.precio / 10000);
      const scoreB = (b.rating || 0) + (b.confort || 0) - (b.precio / 10000);
      return scoreB - scoreA;
    });
  }, [opciones, filtroActivo]);

  const elegirViaje = async (oferta) => {
    setMensajeEnPantalla('');

    if (!usuario) {
      setMensajeEnPantalla('No se encontro el usuario logueado');
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
          tiempoEstimado: oferta.duracionMin || oferta.tiempoEstimado || ruta.duracionMin,
          idTipoServicio: oferta.idTipoServicio,
        }),
      });

      navigation.navigate('ViajeConfirmado', {
        empresaElegida: oferta.empresa,
        precioElegido: oferta.precio,
        usuario,
      });
    } catch (error) {
      setMensajeEnPantalla(error.message || 'No pude guardar el viaje');
      console.log('Error al guardar viaje:', error);
    }
  };

  const obtenerBadge = (oferta, index) => {
    if (index === 0 && filtroActivo === 'barato') return '💸 Mas barata';
    if (index === 0 && filtroActivo === 'rapido') return '⚡ Mas rapida';
    if (index === 0 && filtroActivo === 'recomendado') return '🏆 Recomendada';
    return oferta.recomendacion || '';
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
              {opciones.length} opciones · {ruta.distanciaKm || datosViaje?.distanciaKm} km
            </Text>
          </View>

        </View>

        <View style={estilos.resumenRuta}>
          <Text style={estilos.resumenTitulo}>Ruta real por calles</Text>
          <Text style={estilos.resumenTexto}>
            {ruta.distanciaKm || datosViaje?.distanciaKm} km · {ruta.duracionMin || datosViaje?.duracionMin} min aprox. · {ruta.proveedor || 'rutas'}
          </Text>
        </View>

        <View style={estilos.filtrosBox}>
          {FILTROS.map((filtro) => (
            <TouchableOpacity
              key={filtro.id}
              activeOpacity={0.85}
              onPress={() => setFiltroActivo(filtro.id)}
            >
              {filtroActivo === filtro.id ? (
                <LinearGradient
                  colors={['#2563EB', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={estilos.filtroActivo}
                >
                  <Text style={estilos.filtroActivoTexto}>{filtro.label}</Text>
                </LinearGradient>
              ) : (
                <View style={estilos.filtroChip}>
                  <Text style={estilos.filtroChipTexto}>{filtro.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.lista}>
          {opcionesOrdenadas.map((oferta, index) => (
            <TouchableOpacity
              key={`${oferta.empresa}-${oferta.tipo}`}
              activeOpacity={0.88}
              onPress={() => elegirViaje(oferta)}
            >
              <View style={index === 0 ? estilos.cardDestacada : estilos.cardOferta}>
                <View
                  style={[
                    estilos.logoEmpresa,
                    oferta.empresa === 'Uber' && estilos.logoUber,
                    oferta.empresa === 'DiDi' && estilos.logoDidi,
                    oferta.empresa === 'Didi' && estilos.logoDidi,
                    oferta.empresa === 'Cabify' && estilos.logoCabify,
                  ]}
                >
                  <Text style={estilos.logoTexto}>{oferta.empresa.charAt(0)}</Text>
                </View>

                <View style={estilos.infoOferta}>
                  <Text style={estilos.nombreEmpresa}>
                    {oferta.empresa}
                    <Text style={estilos.tipoServicio}> · {oferta.tipo}</Text>
                  </Text>

                  <Text style={estilos.detalleTexto}>
                    {oferta.llegadaMin} min llegada · {oferta.duracionMin} min viaje
                  </Text>

                  {obtenerBadge(oferta, index) !== '' && (
                    <View style={estilos.badge}>
                      <Text style={estilos.badgeTexto}>{obtenerBadge(oferta, index)}</Text>
                    </View>
                  )}
                </View>

                <View style={estilos.precioBox}>
                  <Text style={estilos.precio}>${oferta.precio.toLocaleString('es-AR')}</Text>

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
  headerTexto: { flex: 1, marginHorizontal: 12 },
  rutaChica: { color: '#9CA3AF', fontSize: 12 },
  tituloHeader: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginTop: 3 },
  resumenRuta: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },
  resumenTitulo: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  resumenTexto: { color: '#B8C1CC', fontSize: 12, marginTop: 5 },
  filtrosBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filtroActivo: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    justifyContent: 'center',
  },
  filtroActivoTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  filtroChip: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  filtroChipTexto: { color: '#B8C1CC', fontSize: 11, fontWeight: '800' },
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
