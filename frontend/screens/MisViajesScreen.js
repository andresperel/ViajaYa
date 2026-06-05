import React, { useEffect, useState } from 'react';

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

      <Text style={estilos.titulo}>Mis viajes</Text>

      <Text style={estilos.subtitulo}>
        Historial de {usuario?.nombre || 'usuario'}
      </Text>

      {mensajeEnPantalla !== '' && (
        <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>
      )}

      <ScrollView style={estilos.listaViajes}>
        {viajesGuardados.map((viaje) => (
          <View key={viaje.idViaje} style={estilos.tarjetaViaje}>

            <Text style={estilos.ruta}>
              {viaje.calleOrigen} → {viaje.calleDestino}
            </Text>

            <Text style={estilos.detalle}>
              Fecha: {viaje.fechaViaje}
            </Text>

            <Text style={estilos.detalle}>
              Tiempo estimado: {viaje.tiempoEstimado} min
            </Text>

            <Text style={estilos.detalle}>
              Usuario ID: {viaje.idUsuario}
            </Text>

            <Text style={estilos.precio}>
              ${viaje.precioEstimado}
            </Text>

          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => navigation.navigate('Home', { usuario })}
      >
        <Text style={estilos.textoBoton}>Volver al inicio</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041B45',
    padding: 20,
  },

  titulo: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },

  subtitulo: {
    color: '#B8C1CC',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  mensaje: {
    color: '#1DD1A1',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },

  listaViajes: {
    flex: 1,
  },

  tarjetaViaje: {
    backgroundColor: '#0A2A66',
    padding: 18,
    borderRadius: 15,
    marginBottom: 14,
  },

  ruta: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  detalle: {
    color: '#B8C1CC',
    marginBottom: 5,
  },

  precio: {
    color: '#1DD1A1',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 15,
    borderRadius: 12,
    marginTop: 12,
  },

  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});