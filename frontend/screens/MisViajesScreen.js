import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

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

  useEffect(() => {
    obtenerMisViajes();
  }, []);

  const obtenerMisViajes = async () => {
    try {
      if (!usuario || !usuario.idUsuario) {
        setMensajeEnPantalla('Volvé a iniciar sesión para ver tus viajes');
        return;
      }

      const respuestaDelServidor = await fetch(
        `http://localhost:3000/viajes/usuario/${usuario.idUsuario}`
      );

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        setViajesGuardados(datosRecibidos);

        if (datosRecibidos.length === 0) {
          setMensajeEnPantalla('Todavía no tenés viajes guardados');
        } else {
          setMensajeEnPantalla('');
        }
      } else {
        setMensajeEnPantalla(datosRecibidos.mensaje || 'No pude cargar los viajes');
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error al obtener viajes:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >
        <View style={estilos.header}>
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => navigation.navigate('Home', { usuario })}
          >
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={estilos.titulo}>Tus viajes</Text>
            <Text style={estilos.subtitulo}>
              Historial y viajes en curso
            </Text>
          </View>
        </View>

        <View style={estilos.chipsBox}>
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.chipActivo}
          >
            <Text style={estilos.chipActivoTexto}>Todos</Text>
          </LinearGradient>

          <View style={estilos.chip}>
            <Text style={estilos.chipTexto}>Este mes</Text>
          </View>

          <View style={estilos.chip}>
            <Text style={estilos.chipTexto}>Anteriores</Text>
          </View>
        </View>

        {mensajeEnPantalla !== '' && (
          <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>
        )}

        <View style={estilos.listaViajes}>
          {viajesGuardados.map((viaje, index) => (
            <ViajeCard key={viaje.idViaje || index} viaje={viaje} index={index} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ViajeCard({ viaje, index }) {
  const marcas = [
    { nombre: 'Uber', color: '#000000' },
    { nombre: 'Didi', color: '#FF7A00' },
    { nombre: 'Cabify', color: '#7B61FF' },
  ];

  const marca = marcas[index % marcas.length];

  return (
    <View style={estilos.tarjetaViaje}>
      <View style={estilos.cardHeader}>
        <View style={[estilos.logoEmpresa, { backgroundColor: marca.color }]}>
          <Text style={estilos.logoTexto}>{marca.nombre.charAt(0)}</Text>
        </View>

        <View style={estilos.infoMarca}>
          <Text style={estilos.marcaTexto}>{marca.nombre}</Text>
          <Text style={estilos.fechaTexto}>{viaje.fechaViaje || 'Fecha no disponible'}</Text>
        </View>

        <Text style={estilos.precio}>
          ${Number(viaje.precioEstimado || 0).toLocaleString('es-AR')}
        </Text>
      </View>

      <View style={estilos.rutaBox}>
        <View style={estilos.rutaLinea}>
          <View style={estilos.puntoOrigen} />
          <View style={estilos.lineaVertical} />
          <View style={estilos.puntoDestino} />
        </View>

        <View style={estilos.rutaTextoBox}>
          <Text style={estilos.rutaTexto} numberOfLines={1}>
            {viaje.calleOrigen}
          </Text>

          <Text style={estilos.rutaTexto} numberOfLines={1}>
            {viaje.calleDestino}
          </Text>
        </View>
      </View>

      <View style={estilos.footerCard}>
        <Text style={estilos.detalle}>📍 Ver detalles</Text>
        <Text style={estilos.repetir}>
          {viaje.tiempoEstimado} min · Repetir viaje
        </Text>
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

  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 2,
  },

  chipsBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },

  chipActivo: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipActivoTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  chip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  chipTexto: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 18,
  },

  listaViajes: {
    marginTop: 22,
  },

  tarjetaViaje: {
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoEmpresa: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  logoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  infoMarca: {
    flex: 1,
  },

  marcaTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  fechaTexto: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  precio: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  rutaBox: {
    marginTop: 16,
    flexDirection: 'row',
  },

  rutaLinea: {
    width: 16,
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 3,
  },

  puntoOrigen: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  lineaVertical: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 6,
  },

  puntoDestino: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },

  rutaTextoBox: {
    flex: 1,
    gap: 10,
  },

  rutaTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  footerCard: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detalle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },

  repetir: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '900',
  },
});