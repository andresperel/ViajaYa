// Importo React y useState para manejar mensajes en pantalla.
import React, { useState } from 'react';

// Importo los componentes que voy a usar.
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla muestra las opciones encontradas.
export default function ResultadosScreen({ navigation, route }) {

  // Recibo el origen y destino que mandé desde Home.
  const { origenIngresado, destinoIngresado } = route.params;

  // Guardo un mensaje para saber si el viaje se está guardando o si hubo error.
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función se ejecuta cuando elijo una opción de viaje.
  const elegirViaje = async (
    empresaElegida,
    precioElegido,
    tiempoElegido,
    idTipoServicioElegido
  ) => {

    // Limpio mensajes anteriores.
    setMensajeEnPantalla('');

    try {

      // Muestro que estoy guardando el viaje elegido.
      setMensajeEnPantalla('Guardando viaje...');

      // Envío el viaje elegido al backend para guardarlo en Supabase.
      const respuestaDelServidor = await fetch(
        'http://192.168.1.12:3000/viaje',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            calleOrigen: origenIngresado,
            calleDestino: destinoIngresado,
            precioEstimado: precioElegido,
            tiempoEstimado: tiempoElegido,
            idUsuario: 1,
            idTipoServicio: idTipoServicioElegido,
          }),
        }
      );

      // Convierto la respuesta del backend a JSON.
      const datosRecibidos = await respuestaDelServidor.json();

      // Si el viaje se guardó bien, voy a la pantalla de confirmación.
      if (respuestaDelServidor.ok) {
        navigation.navigate('ViajeConfirmado', {
          empresaElegida: empresaElegida,
          precioElegido: precioElegido,
        });
      } else {
        setMensajeEnPantalla(
          datosRecibidos.detalle || datosRecibidos.mensaje
        );
      }

    } catch (error) {

      // Si no pude conectarme con el backend, aviso en pantalla.
      setMensajeEnPantalla('No pude conectarme con el servidor');

      // También muestro el error en consola para poder revisarlo.
      console.log('Error al guardar viaje:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        Opciones disponibles
      </Text>

      <Text style={estilos.ruta}>
        {origenIngresado} → {destinoIngresado}
      </Text>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Didi</Text>
        <Text style={estilos.precio}>$4200</Text>
        <Text style={estilos.tiempo}>18 min aprox.</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Didi', 4200, 18, 2)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Uber</Text>
        <Text style={estilos.precio}>$4500</Text>
        <Text style={estilos.tiempo}>15 min aprox.</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Uber', 4500, 15, 1)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Cabify</Text>
        <Text style={estilos.precio}>$4700</Text>
        <Text style={estilos.tiempo}>20 min aprox.</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Cabify', 4700, 20, 3)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.mensaje}>
        {mensajeEnPantalla}
      </Text>

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
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  ruta: {
    color: '#B8C1CC',
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 16,
  },

  tarjetaViaje: {
    backgroundColor: '#0A2A66',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  nombreEmpresa: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  precio: {
    color: '#1DD1A1',
    fontSize: 20,
    marginTop: 10,
  },

  tiempo: {
    color: '#B8C1CC',
    marginBottom: 15,
    marginTop: 5,
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 12,
    borderRadius: 10,
  },

  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  mensaje: {
    color: '#1DD1A1',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },

});