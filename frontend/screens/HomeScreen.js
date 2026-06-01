// Importo React y useState para manejar los datos escritos por el usuario.
import React, { useState } from 'react';

// Importo los componentes que necesito para armar la pantalla.
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla es el inicio de la app después de iniciar sesión.
export default function HomeScreen({ navigation }) {

  // Guardo el lugar desde donde sale el usuario.
  const [origenIngresado, setOrigenIngresado] = useState('');

  // Guardo el destino al que quiere ir el usuario.
  const [destinoIngresado, setDestinoIngresado] = useState('');

  // Guardo un mensaje para avisar si falta completar algo.
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función se ejecuta cuando presiono "Buscar viaje".
  const manejarBusquedaViaje = () => {

    // Limpio el mensaje anterior.
    setMensajeEnPantalla('');

    // Verifico que origen y destino estén completos.
    if (!origenIngresado || !destinoIngresado) {
      setMensajeEnPantalla('Completá origen y destino');
      return;
    }

    // Voy a la pantalla de resultados y le envío los datos ingresados.
    navigation.navigate('Resultados', {
      origenIngresado: origenIngresado,
      destinoIngresado: destinoIngresado,
    });
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        ViajaYA
      </Text>

      <Text style={estilos.subtitulo}>
        ¿A dónde querés viajar?
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Origen"
        placeholderTextColor="#999"
        value={origenIngresado}
        onChangeText={setOrigenIngresado}
      />

      <TextInput
        style={estilos.input}
        placeholder="Destino"
        placeholderTextColor="#999"
        value={destinoIngresado}
        onChangeText={setDestinoIngresado}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={manejarBusquedaViaje}
      >
        <Text style={estilos.textoBoton}>
          Buscar viaje
        </Text>
      </TouchableOpacity>

      <Text style={estilos.mensaje}>
        {mensajeEnPantalla}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={estilos.link}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#041B45',
    justifyContent: 'center',
    padding: 24,
  },

  titulo: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitulo: {
    color: '#B8C1CC',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 35,
  },

  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  textoBoton: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },

  mensaje: {
    color: '#1DD1A1',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },

  link: {
    textAlign: 'center',
    color: 'white',
    marginTop: 20,
  },

});