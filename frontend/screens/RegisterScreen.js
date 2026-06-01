// Importo React y useState para guardar los datos del formulario.
import React, { useState } from 'react';

// Importo los componentes que necesito para armar la pantalla.
import {
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla sirve para registrar un usuario nuevo.
export default function RegisterScreen({ navigation }) {

  // Guardo el nombre que escribe el usuario.
  const [nombreIngresado, setNombreIngresado] = useState('');

  // Guardo el teléfono que escribe el usuario.
  const [telefonoIngresado, setTelefonoIngresado] = useState('');

  // Guardo el correo que escribe el usuario.
  const [correoIngresado, setCorreoIngresado] = useState('');

  // Guardo la contraseña que escribe el usuario.
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');

  // Guardo un mensaje para mostrar errores o avisos en pantalla.
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función se ejecuta cuando presiono "Registrarme".
  const manejarRegistroUsuario = async () => {

    // Limpio el mensaje anterior.
    setMensajeEnPantalla('');

    // Verifico que todos los campos estén completos.
    if (!nombreIngresado || !telefonoIngresado || !correoIngresado || !contraseñaIngresada) {
      setMensajeEnPantalla('Completá todos los campos');
      return;
    }

    try {

      // Muestro que estoy intentando registrar al usuario.
      setMensajeEnPantalla('Registrando usuario...');

      // Envío los datos al backend para guardarlos en Supabase.
      const respuestaDelServidor = await fetch(
        'http://192.168.1.12:3000/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: nombreIngresado,
            telefono: telefonoIngresado,
            email: correoIngresado,
            password: contraseñaIngresada,
          }),
        }
      );

      // Convierto la respuesta del backend a JSON.
      const datosRecibidos = await respuestaDelServidor.json();

      // Muestro en consola la respuesta para revisar errores.
      console.log('Respuesta del backend:', datosRecibidos);
      console.log('Status:', respuestaDelServidor.status);

      // Si el registro salió bien, vuelvo al login.
      if (respuestaDelServidor.ok) {
        setMensajeEnPantalla('Usuario registrado correctamente');

        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);

      } else {

        // Si falla, muestro el detalle real si existe.
        setMensajeEnPantalla(
          datosRecibidos.detalle || datosRecibidos.mensaje || 'Error al registrar'
        );
      }

    } catch (error) {

      // Si no pude conectarme con el backend, muestro un mensaje.
      setMensajeEnPantalla('No pude conectarme con el servidor');

      // También muestro el error en consola para poder revisarlo.
      console.log('Error de conexión:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        Registrarse
      </Text>

      <TextInput
        style={estilos.input}
        placeholder="Nombre"
        placeholderTextColor="#999"
        value={nombreIngresado}
        onChangeText={setNombreIngresado}
      />

      <TextInput
        style={estilos.input}
        placeholder="Teléfono"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={telefonoIngresado}
        onChangeText={setTelefonoIngresado}
      />

      <TextInput
        style={estilos.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        autoCapitalize="none"
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
        onPress={manejarRegistroUsuario}
      >
        <Text style={estilos.textoBoton}>
          Registrarme
        </Text>
      </TouchableOpacity>

      <Text style={estilos.mensaje}>
        {mensajeEnPantalla}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={estilos.link}>
          Ya tengo cuenta
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
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
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