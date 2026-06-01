// Importo React y el hook useState para guardar datos.
import React, { useState } from 'react';

// Importo los componentes que voy a mostrar en pantalla.
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Este componente representa la pantalla de inicio de sesión.
export default function LoginScreen({ navigation }) {

  // Guardo el email que escribe el usuario.
  const [correoIngresado, setCorreoIngresado] = useState('');

  // Guardo la contraseña que escribe el usuario.
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');

  // Guardo un mensaje para mostrarlo en la pantalla.
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función se ejecuta cuando presiono "Ingresar".
  const manejarInicioSesion = async () => {
    
    // Muestro en consola que el botón fue presionado.
    console.log('Toqué el botón ingresar');

    // Limpio el mensaje anterior.
    setMensajeEnPantalla('');

    // Verifico que ambos campos estén completos.
    if (!correoIngresado || !contraseñaIngresada) {
      setMensajeEnPantalla('Completá todos los campos');
      return;
    }

    try {

      // Aviso en pantalla que estoy intentando conectarme.
      setMensajeEnPantalla('Intentando iniciar sesión...');

      // Envío los datos al backend.
      const respuestaDelServidor = await fetch(
        'http://192.168.1.12:3000/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: correoIngresado,
            password: contraseñaIngresada,
          }),
        }
      );

      // Convierto la respuesta a JSON.
      const datosRecibidos = await respuestaDelServidor.json();

      // Si el login fue exitoso navego al Home.
      if (respuestaDelServidor.ok) {

        setMensajeEnPantalla('Inicio de sesión exitoso');
        navigation.navigate('Home');

      } else {

        setMensajeEnPantalla(datosRecibidos.mensaje);

      }

    } catch (error) {

      // Si falla la conexión, muestro el error en pantalla.
      setMensajeEnPantalla('No pude conectarme con el servidor');

      // También lo muestro en consola para poder revisarlo.
      console.log(error);

    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        ViajaYA
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        value={correoIngresado}
        onChangeText={setCorreoIngresado}
      />

      <TextInput
        style={estilos.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={contraseñaIngresada}
        onChangeText={setContraseñaIngresada}
      />

      <TouchableOpacity
        style={estilos.boton}
        onPress={manejarInicioSesion}
      >
        <Text style={estilos.textoBoton}>
          Ingresar
        </Text>
      </TouchableOpacity>

      <Text style={estilos.mensaje}>
        {mensajeEnPantalla}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={estilos.link}>
          ¿No tenés cuenta? Registrate
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
    marginBottom: 40,
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