import React, { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyTrips } from '../services/api';

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

  const [viajesGuardados, setViajesGuardados] = useState([]);
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('Cargando viajes...');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useEffect(() => {
    obtenerMisViajes();
  }, []);

  const obtenerMisViajes = async () => {
    try {
      setMensajeEnPantalla('Cargando viajes...');

      const datosRecibidos = await getMyTrips();
      setViajesGuardados(Array.isArray(datosRecibidos) ? datosRecibidos : []);

      if (!datosRecibidos || datosRecibidos.length === 0) {
        setMensajeEnPantalla('Todavia no tenes viajes guardados');
      } else {
        setMensajeEnPantalla('');
      }
    } catch (error) {
      setMensajeEnPantalla(error.status === 401
        ? 'Volve a iniciar sesion para ver tus viajes'
        : 'No pude conectarme con el servidor');
      console.log('Error al obtener viajes:', error);
    }
  };

  const viajesFiltrados = useMemo(() => {
    if (filtroActivo === 'todos') return viajesGuardados;

    const ahora = new Date();
    return viajesGuardados.filter((viaje) => {
      const fecha = new Date(viaje.fechaViaje);
      if (Number.isNaN(fecha.getTime())) return filtroActivo === 'anteriores';
      const mismoMes = fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      return filtroActivo === 'mes' ? mismoMes : !mismoMes;
    });
  }, [viajesGuardados, filtroActivo]);

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navigation.navigate('Home', { usuario })}>
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={estilos.titulo}>Tus viajes</Text>
            <Text style={estilos.subtitulo}>Historial y viajes en curso</Text>
          </View>
        </View>

        <View style={estilos.chipsBox}>
          <FiltroChip id="todos" label="Todos" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
          <FiltroChip id="mes" label="Este mes" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
          <FiltroChip id="anteriores" label="Anteriores" filtroActivo={filtroActivo} onPress={setFiltroActivo} />
        </View>

        {mensajeEnPantalla !== '' && <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>}

        <View style={estilos.listaViajes}>
          {viajesFiltrados.map((viaje, index) => (
            <ViajeCard key={viaje.idViaje || index} viaje={viaje} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FiltroChip({ id, label, filtroActivo, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(id)}>
      {filtroActivo === id ? (
        <LinearGradient
          colors={['#2563EB', '#22C55E']}
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

  return (
    <View style={estilos.viajeCard}>
      <View style={estilos.iconoViajeBox}>
        <Text style={estilos.iconoViaje}>🚗</Text>
      </View>

      <View style={estilos.viajeInfo}>
        <Text style={estilos.viajeRuta} numberOfLines={1}>{viaje.calleOrigen}</Text>
        <Text style={estilos.viajeRutaDestino} numberOfLines={1}>{viaje.calleDestino}</Text>
        <Text style={estilos.viajeMeta}>{fecha} · {viaje.tiempoEstimado} min</Text>
      </View>

      <Text style={estilos.viajePrecio}>${precio}</Text>
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
});
