import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [correoIngresado, setCorreoIngresado] = useState('');
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  const manejarInicioSesion = async () => {
    setMensajeEnPantalla('');

    if (!correoIngresado || !contraseñaIngresada) {
      setMensajeEnPantalla('Completá todos los campos');
      return;
    }

    try {
      setMensajeEnPantalla('Ingresando...');

      const respuestaDelServidor = await fetch(
        'http://localhost:3000/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: correoIngresado.trim().toLowerCase(),
            password: contraseñaIngresada.trim(),
          }),
        }
      );

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        navigation.navigate('Home', {
          usuario: datosRecibidos.usuario,
        });
      } else {
        setMensajeEnPantalla(datosRecibidos.mensaje || 'No pude iniciar sesión');
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error al iniciar sesión:', error);
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

        <View style={estilos.logoBoxWrapper}>
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.logoBox}
          >
            <Text style={estilos.logoIcono}>↗</Text>
          </LinearGradient>
        </View>

        <View style={estilos.header}>
          <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
          <Text style={estilos.subtitulo}>Ingresá para continuar.</Text>
        </View>

        <View style={estilos.formulario}>

          <Text style={estilos.label}>Correo electrónico</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>✉️</Text>
            <TextInput
              style={estilos.input}
              placeholder="vos@ejemplo.com"
              placeholderTextColor="#7F8EA3"
              value={correoIngresado}
              onChangeText={setCorreoIngresado}
              autoCapitalize="none"
            />
          </View>

          <Text style={estilos.label}>Contraseña</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>🔒</Text>
            <TextInput
              style={estilos.input}
              placeholder="••••••••"
              placeholderTextColor="#7F8EA3"
              secureTextEntry
              value={contraseñaIngresada}
              onChangeText={setContraseñaIngresada}
            />
          </View>

          <TouchableOpacity>
            <Text style={estilos.olvidaste}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={manejarInicioSesion}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={estilos.botonPrincipal}
            >
              <Text style={estilos.textoBotonPrincipal}>
                Ingresar
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={estilos.mensaje}>
            {mensajeEnPantalla}
          </Text>

        </View>

        <View style={estilos.divisorBox}>
          <View style={estilos.linea} />
          <Text style={estilos.divisorTexto}>O CONTINUÁ CON</Text>
          <View style={estilos.linea} />
        </View>

        <View style={estilos.socialBox}>
          <TouchableOpacity style={estilos.socialBoton}>
            <Text style={estilos.socialTexto}> Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.socialBoton}>
            <Text style={estilos.socialTexto}>G Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={estilos.crearCuentaBox}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={estilos.crearCuentaTexto}>
            ¿No tenés cuenta? <Text style={estilos.crearCuentaLink}>Crear cuenta</Text>
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

  logoBoxWrapper: {
    alignItems: 'center',
    marginTop: 34,
  },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoIcono: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },

  header: {
    marginTop: 26,
    alignItems: 'center',
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#B8C1CC',
    fontSize: 14,
    marginTop: 8,
  },

  formulario: {
    marginTop: 34,
  },

  label: {
    color: '#B8C1CC',
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 7,
    fontWeight: '600',
  },

  inputBox: {
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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

  olvidaste: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: -4,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 14,
  },

  divisorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 18,
  },

  linea: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  divisorTexto: {
    color: '#7F8EA3',
    fontSize: 10,
    letterSpacing: 2,
    marginHorizontal: 10,
  },

  socialBox: {
    flexDirection: 'row',
    gap: 12,
  },

  socialBoton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  socialTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  crearCuentaBox: {
    marginTop: 'auto',
    paddingTop: 30,
  },

  crearCuentaTexto: {
    color: '#B8C1CC',
    textAlign: 'center',
    fontSize: 14,
  },

  crearCuentaLink: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
});