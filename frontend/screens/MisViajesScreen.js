import React, { useCallback, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyTrips } from '../services/api';
import { useApp } from '../context/AppContext';
import { useFocusEffect } from '@react-navigation/native';
import BusinessBadge from '../components/BusinessBadge';
import { filterBusinessTrips, filterPeriod, estimatedCost, tripProvider } from '../utils/businessTrips';

import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function MisViajesScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;
  const { modoViajaYa } = useApp();
  const business = modoViajaYa === 'business';

  const [viajesGuardados, setViajesGuardados] = useState([]);
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('Cargando viajes...');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useFocusEffect(useCallback(() => {
    let active = true;
    obtenerMisViajes(() => active);
    return () => { active = false; };
  }, [usuario?.idUsuario]));

  const obtenerMisViajes = async (isActive = () => true) => {
    try {
      setMensajeEnPantalla('Cargando viajes...');
      setViajesGuardados([]);

      const datosRecibidos = await getMyTrips();
      if (!isActive()) return;
      setViajesGuardados(Array.isArray(datosRecibidos) ? datosRecibidos : []);

      if (!datosRecibidos || datosRecibidos.length === 0) {
        setMensajeEnPantalla('Todavia no tenes viajes guardados');
      } else {
        setMensajeEnPantalla('');
      }
    } catch (error) {
      if (!isActive()) return;
      setMensajeEnPantalla(error.status === 401
        ? 'Volve a iniciar sesion para ver tus viajes'
        : 'No pude conectarme con el servidor');
      console.log('Error al obtener viajes:', error);
    } finally {
      if (!isActive()) return;
      setMensajeEnPantalla((mensajeActual) => (
        mensajeActual === 'Cargando viajes...' ? '' : mensajeActual
      ));
    }
  };

  const viajesFiltrados = useMemo(() => {
    if (business) return filterPeriod(filterBusinessTrips(viajesGuardados), filtroActivo);
    if (filtroActivo === 'todos') return viajesGuardados;

    const ahora = new Date();
    return viajesGuardados.filter((viaje) => {
      const fecha = new Date(viaje.fechaViaje);
      if (Number.isNaN(fecha.getTime())) return filtroActivo === 'anteriores';
      const mismoMes = fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      return filtroActivo === 'mes' ? mismoMes : !mismoMes;
    });
  }, [viajesGuardados, filtroActivo, business]);

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navigation.navigate('Home', { usuario })}>
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={estilos.titulo}>{business ? 'Tus viajes laborales' : 'Tus viajes'}</Text>
            <Text style={estilos.subtitulo}>{business ? 'Viajes Business guardados' : 'Historial y viajes en curso'}</Text>
            {business && <BusinessBadge />}
          </View>
        </View>

        <View style={estilos.chipsBox}>
          <FiltroChip id="todos" label="Todos" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
          <FiltroChip id="mes" label="Este mes" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
          <FiltroChip id="anteriores" label="Anteriores" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
        </View>

        {mensajeEnPantalla !== '' && <Text style={estilos.mensaje}>{business && mensajeEnPantalla === 'Todavia no tenes viajes guardados' ? 'Todavía no tenés viajes laborales guardados.' : mensajeEnPantalla}</Text>}
        {business && !mensajeEnPantalla && <>
          <Text style={estilos.subtitulo}>Costo estimado del período: ${estimatedCost(viajesFiltrados).toLocaleString('es-AR')}</Text>
          <Text style={estilos.subtitulo}>{filtroActivo === 'mes' ? 'Este mes' : filtroActivo === 'anteriores' ? 'Meses anteriores' : 'Todo el historial'}</Text>
          {!viajesFiltrados.length && <Text style={estilos.mensaje}>No tenés viajes laborales guardados en este período.</Text>}
        </>}

        <View style={estilos.listaViajes}>
          {viajesFiltrados.slice(0, 20).map((viaje, index) => (
            <ViajeCard key={viaje.idViaje || index} viaje={viaje} />
          ))}
        </View>

        {viajesFiltrados.length > 20 && (
          <Text style={estilos.limiteTexto}>Mostrando los 20 viajes más recientes</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FiltroChip({ id, label, filtroActivo, onPress }) {
  const { modoViajaYa } = useApp();
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(id)}>
      {filtroActivo === id ? (
        <LinearGradient
          colors={modoViajaYa === 'business' ? ['#142D50', '#2563EB'] : ['#2563EB', '#22C55E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={estilos.chipActivo}
        >
          <Text style={estilos.chipActivoTexto}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={estilos.chip}><Text style={estilos.chipTexto}>{label}</Text></View>
      )}
    </TouchableOpacity>
  );
}

function ViajeCard({ viaje }) {
  const fecha = viaje.fechaViaje || 'Sin fecha';
  const precio = Number(viaje.precioEstimado || 0).toLocaleString('es-AR');
  const estado = viaje.estado || 'pendiente';

  return (
    <View style={estilos.viajeCard}>
      <View style={estilos.iconoViajeBox}>
        <Text style={estilos.iconoViaje}>🚗</Text>
      </View>

      <View style={estilos.viajeInfo}>
        <Text style={estilos.viajeRuta} numberOfLines={1}>{viaje.calleOrigen}</Text>
        <Text style={estilos.viajeRutaDestino} numberOfLines={1}>{viaje.calleDestino}</Text>
        {viaje.tipoViaje === 'business' && <>
          <Text style={estilos.viajeMeta}>{tripProvider(viaje)} · Precio estimado</Text>
          {!!viaje.motivoViaje && <Text style={estilos.viajeMeta}>Motivo: {viaje.motivoViaje}</Text>}
        </>}
        <Text style={estilos.viajeMeta}>{fecha} · {viaje.tiempoEstimado} min</Text>
      </View>

      <View style={estilos.viajeLateral}>
        <Text style={estilos.viajePrecio}>${precio}</Text>
        <Text style={[estilos.estadoBadge, estilos[`estado_${estado}`]]}>{estado}</Text>
      </View>

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
    fontSize: 26,
    fontWeight: '900',
  },

  subtitulo: {
    color: '#B8C1CC',
    fontSize: 13,
    marginTop: 3,
  },

  chipsBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },

  chipActivo: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: 'center',
  },

  chipActivoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
  },

  chipTexto: {
    color: '#B8C1CC',
    fontSize: 12,
    fontWeight: '700',
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    marginTop: 26,
    fontWeight: 'bold',
  },

  listaViajes: {
    marginTop: 20,
  },

  viajeCard: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  iconoViajeBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(37,99,235,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconoViaje: {
    fontSize: 20,
  },

  viajeInfo: {
    flex: 1,
  },

  viajeRuta: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  viajeRutaDestino: {
    color: '#B8C1CC',
    fontSize: 12,
    marginTop: 4,
  },

  viajeMeta: {
    color: '#7F8EA3',
    fontSize: 11,
    marginTop: 6,
  },

  viajePrecio: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 12,
  },
  viajeLateral: { alignItems: 'flex-end', marginLeft: 12 },
  estadoBadge: { marginTop: 6, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  estado_pendiente: { color: '#FBBF24' },
  estado_realizado: { color: '#22C55E' },
  estado_cancelado: { color: '#F87171' },
  limiteTexto: { color: '#7F8EA3', textAlign: 'center', fontSize: 11, marginTop: 8 },
});
