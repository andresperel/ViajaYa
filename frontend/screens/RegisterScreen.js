// Importo React y useState para guardar los datos del formulario.
import React, { useState } from 'react';

// Importo los componentes que necesito para armar la pantalla.
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla sirve para registrar un usuario nuevo.
export default function RegisterScreen({ navigation }) {

  const [nombreIngresado, setNombreIngresado] = useState('');
  const [telefonoIngresado, setTelefonoIngresado] = useState('');
  const [correoIngresado, setCorreoIngresado] = useState('');
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  const manejarRegistroUsuario = async () => {
    setMensajeEnPantalla('');

    if (!nombreIngresado || !telefonoIngresado || !correoIngresado || !contraseñaIngresada) {
      setMensajeEnPantalla('Completá todos los campos');
      return;
    }

    try {
      setMensajeEnPantalla('Creando cuenta...');

      const respuestaDelServidor = await fetch(
        'http://localhost:3000/register',
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

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        setMensajeEnPantalla('Cuenta creada correctamente');

        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);

      } else {
        setMensajeEnPantalla(
          datosRecibidos.detalle || datosRecibidos.mensaje || 'Error al registrar'
        );
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error de conexión:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <View style={estilos.contenido}>

        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={estilos.botonVolverTexto}>←</Text>
        </TouchableOpacity>

        <View style={estilos.progresoBox}>
          <View style={estilos.progresoActivo} />
          <View style={estilos.progresoInactivo} />
          <View style={estilos.progresoInactivo} />
        </View>

        <Text style={estilos.paso}>
          Paso 1 de 3
        </Text>

        <Text style={estilos.titulo}>
          Crear cuenta
        </Text>

        <Text style={estilos.subtitulo}>
          Toma menos de un minuto. Sin tarjeta.
        </Text>

        <View style={estilos.formulario}>

          <Text style={estilos.label}>Nombre completo</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>👤</Text>
            <TextInput
              style={estilos.input}
              placeholder="María González"
              placeholderTextColor="#7F8EA3"
              value={nombreIngresado}
              onChangeText={setNombreIngresado}
            />
          </View>

          <Text style={estilos.label}>Correo electrónico</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>✉️</Text>
            <TextInput
              style={estilos.input}
              placeholder="maria@ejemplo.com"
              placeholderTextColor="#7F8EA3"
              autoCapitalize="none"
              value={correoIngresado}
              onChangeText={setCorreoIngresado}
            />
          </View>

          <Text style={estilos.label}>Teléfono</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>📱</Text>
            <TextInput
              style={estilos.input}
              placeholder="+54 11 0000 0000"
              placeholderTextColor="#7F8EA3"
              keyboardType="numeric"
              value={telefonoIngresado}
              onChangeText={setTelefonoIngresado}
            />
          </View>

          <Text style={estilos.label}>Contraseña</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>🔒</Text>
            <TextInput
              style={estilos.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#7F8EA3"
              secureTextEntry
              value={contraseñaIngresada}
              onChangeText={setContraseñaIngresada}
            />
          </View>

          <View style={estilos.terminosBox}>
            <View style={estilos.checkBox}>
              <Text style={estilos.checkTexto}>✓</Text>
            </View>

            <Text style={estilos.terminosTexto}>
              Acepto los términos y condiciones y la política de privacidad.
            </Text>
          </View>

          <TouchableOpacity
            style={estilos.botonPrincipal}
            onPress={manejarRegistroUsuario}
          >
            <Text style={estilos.textoBotonPrincipal}>
              Crear cuenta
            </Text>
          </TouchableOpacity>

          <Text style={estilos.mensaje}>
            {mensajeEnPantalla}
          </Text>

        </View>

        <TouchableOpacity
          style={estilos.loginBox}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.loginTexto}>
            ¿Ya tenés cuenta? <Text style={estilos.loginLink}>Iniciar sesión</Text>
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0F1F3A',
  },

  contenido: {
    flex: 1,
    padding: 24,
    paddingTop: 18,
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

  botonVolverTexto: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  progresoBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 32,
  },

  progresoActivo: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },

  progresoInactivo: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  paso: {
    color: '#B8C1CC',
    fontSize: 11,
    marginTop: 12,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 14,
  },

  subtitulo: {
    color: '#B8C1CC',
    fontSize: 14,
    marginTop: 8,
  },

  formulario: {
    marginTop: 28,
  },

  label: {
    color: '#B8C1CC',
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 7,
    fontWeight: '600',
  },

  inputBox: {
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  inputIcono: {
    fontSize: 16,
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    outlineStyle: 'none',
  },

  terminosBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  checkTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  terminosTexto: {
    color: '#B8C1CC',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 14,
  },

  loginBox: {
    marginTop: 'auto',
    paddingTop: 30,
  },

  loginTexto: {
    color: '#B8C1CC',
    textAlign: 'center',
    fontSize: 14,
  },

  loginLink: {
    color: '#22C55E',
    fontWeight: 'bold',
  },

});