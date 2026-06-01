// Importo React.
import React, { useEffect, useState } from 'react';

// Importo componentes.
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function MisViajesScreen() {

  // Guardo los viajes recibidos.
  const [viajes, setViajes] = useState([]);

  // Cuando abre la pantalla.
  useEffect(() => {
    obtenerViajes();
  }, []);

  // Pido los viajes al backend.
  const obtenerViajes = async () => {

    try {

      const respuesta = await fetch(
        'http://192.168.1.12:3000/viajes'
      );

      const datos = await respuesta.json();

      setViajes(datos);

    } catch (error) {

      console.log(error);

    }

  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        Mis viajes
      </Text>

      <ScrollView>

        {viajes.map((viaje) => (

          <View
            key={viaje.idViaje}
            style={estilos.tarjeta}
          >

            <Text style={estilos.texto}>
              📍 {viaje.calleOrigen}
            </Text>

            <Text style={estilos.texto}>
              🏁 {viaje.calleDestino}
            </Text>

            <Text style={estilos.precio}>
              ${viaje.precioEstimado}
            </Text>

          </View>

        ))}

      </ScrollView>

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
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  tarjeta: {
    backgroundColor: '#0A2A66',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  texto: {
    color: 'white',
    marginBottom: 5,
  },

  precio: {
    color: '#1DD1A1',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },

});