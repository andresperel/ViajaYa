import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { apiFetch, setAuthToken } from '../services/api';

const GOOGLE_CONFIG = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

let googleNativo = null;
try {
  googleNativo = require('@react-native-google-signin/google-signin');
  googleNativo.GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    offlineAccess: false,
  });
} catch (error) {
  // Expo Go no incluye RNGoogleSignin. La APK nativa si lo registra.
}

export default function LoginScreen({ navigation, route }) {
  useEffect(() => navigation.addListener('blur', () => {
    navigation.setParams({ registroExitoso: undefined });
  }), [navigation]);
  const [correoIngresado, setCorreoIngresado] = useState('');
  const [passwordIngresada, setPasswordIngresada] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  const navegarConSesion = (datosRecibidos) => {
    setAuthToken(datosRecibidos.token);
    navigation.navigate('Home', {
      usuario: datosRecibidos.usuario,
    });
  };

  const manejarInicioSesion = async () => {
    setMensajeEnPantalla('');

    if (!correoIngresado || !passwordIngresada) {
      setMensajeEnPantalla('Completa todos los campos');
      return;
    }


    try {
      setMensajeEnPantalla('Ingresando...');

      const datosRecibidos = await apiFetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          email: correoIngresado.trim().toLowerCase(),
          password: passwordIngresada.trim(),
        }),
      });

      navegarConSesion(datosRecibidos);
    } catch (error) {
      setMensajeEnPantalla(error.message || 'No pude iniciar sesion');
      console.log('Error al iniciar sesion:', error);

    }
  };

  const iniciarSesionSocialBackend = async ({ provider, email, nombre, accessToken }) => {
    const datosRecibidos = await apiFetch('/social-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, nombre, accessToken }),
    });
    navegarConSesion(datosRecibidos);
  };

  const manejarGoogle = async () => {
    if (!googleNativo?.GoogleSignin) {
      setMensajeEnPantalla('Google requiere abrir la APK instalada, no Expo Go');
      return;
    }

    const { GoogleSignin, isCancelledResponse } = googleNativo;
    if (!GOOGLE_CONFIG.webClientId || !GOOGLE_CONFIG.androidClientId) {
      setMensajeEnPantalla('Faltan las credenciales de Google');
      return;
    }

    try {
      setMensajeEnPantalla('Eligiendo cuenta de Google...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => {});
      const resultado = await GoogleSignin.signIn();
      if (isCancelledResponse(resultado)) {
        setMensajeEnPantalla('');
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      setMensajeEnPantalla('Validando cuenta de Google...');
      await iniciarSesionSocialBackend({
        provider: 'google',
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      setMensajeEnPantalla(`No pude ingresar con Google${error.code ? ` (${error.code})` : ''}`);
      console.log('Error de Google:', error);
    }
  };

  const manejarApple = async () => {
    try {
      const disponible = await AppleAuthentication.isAvailableAsync();
      if (!disponible) {
        setMensajeEnPantalla('Apple Sign In solo esta disponible en dispositivos Apple compatibles');
        return;
      }

      setMensajeEnPantalla('Abriendo Apple...');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const nombre = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');

      await iniciarSesionSocialBackend({
        provider: 'apple',
        email: credential.email || `${credential.user}@apple.viajaya`,
        nombre: nombre || 'Usuario Apple',
      });
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        setMensajeEnPantalla('');
        return;
      }
      setMensajeEnPantalla(error.message || 'No pude ingresar con Apple');
      console.log('Error de Apple:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      {route.params?.registroExitoso && (
        <Text accessibilityRole="alert" style={{ color: '#22C55E', textAlign: 'center', padding: 12 }}>
          {route.params.registroExitoso.nombre}, tu cuenta fue creada correctamente.
          Ya podés iniciar sesión con {route.params.registroExitoso.email}.
        </Text>
      )}
      <View style={estilos.contenido}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={estilos.botonVolverTexto}>←</Text>
        </TouchableOpacity>

        <View style={estilos.headerLogin}>
          <Text style={estilos.titulo}>Iniciar sesion</Text>
          <Text style={estilos.subtitulo}>Ingresa para continuar.</Text>
        </View>

        <View style={estilos.formulario}>
          <Text style={estilos.label}>Correo electronico</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>✉️</Text>
            <TextInput
              style={estilos.input}
              placeholder="maria@ejemplo.com"
              placeholderTextColor="#7F8EA3"
              value={correoIngresado}
              onChangeText={setCorreoIngresado}
              autoCapitalize="none"
            />
          </View>

          <Text style={estilos.label}>Contrasena</Text>
          <View style={estilos.inputBox}>
            <Text style={estilos.inputIcono}>🔒</Text>
            <TextInput
              style={estilos.input}
              placeholder="Minimo 6 caracteres"
              placeholderTextColor="#7F8EA3"
              secureTextEntry
              value={passwordIngresada}
              onChangeText={setPasswordIngresada}
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
            <Text style={estilos.olvidaste}>¿Olvidaste tu contrasena?</Text>
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
              <Text style={estilos.textoBotonPrincipal}>Ingresar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>
        </View>

        <View style={estilos.divisorBox}>
          <View style={estilos.linea} />
          <Text style={estilos.divisorTexto}>O CONTINUA CON</Text>
          <View style={estilos.linea} />
        </View>

        <View style={estilos.socialBox}>
          <TouchableOpacity
            style={estilos.socialBoton}
            onPress={manejarApple}
          >
            <Text style={estilos.socialTexto}> Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.socialBoton}
            onPress={manejarGoogle}
          >
            <Text style={estilos.socialTexto}>G Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={estilos.crearCuentaBox}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={estilos.crearCuentaTexto}>
            ¿No tenes cuenta? <Text style={estilos.crearCuentaLink}>Crear cuenta</Text>
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
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
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

  botonVolverTexto: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  headerLogin: {
    marginTop: 30,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    marginTop: 10,
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },

  formulario: {
    marginTop: 26,
  },

  label: {
    color: '#B8C1CC',
    fontSize: 11,
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
    minHeight: 18,
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

  socialBotonDeshabilitado: {
    opacity: 0.55,
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
