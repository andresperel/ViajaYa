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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.156:3000';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const pedirCodigo = async () => {
    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio) {
      setMensaje('Ingresa tu email');
      return;
    }

    try {
      setMensaje('Enviando email...');

      const respuesta = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLimpio }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setCodigoEnviado(true);
        setMensaje(datos.devToken
          ? `${datos.mensaje} Codigo: ${datos.devToken}`
          : datos.mensaje || 'Te enviamos un codigo para restablecer tu contrasena');
      } else {
        setMensaje(datos.mensaje || 'No pude enviar el email');
      }
    } catch (error) {
      setMensaje('No pude conectarme con el servidor');
      console.log('Error al pedir reset:', error);
    }
  };

  const restablecerPassword = async () => {
    if (!email.trim() || !codigo.trim() || !password.trim()) {
      setMensaje('Completa email, codigo y contrasena');
      return;
    }

    if (password.trim().length < 6 || password.trim().length > 30) {
      setMensaje('La contrasena debe tener entre 6 y 30 caracteres');
      return;
    }

    try {
      setMensaje('Restableciendo contrasena...');

      const respuesta = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: codigo.trim(),
          password: password.trim(),
        }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        setMensaje('Contrasena actualizada');
        setTimeout(() => navigation.navigate('Login'), 1000);
      } else {
        setMensaje(datos.mensaje || 'No pude restablecer la contrasena');
      }
    } catch (error) {
      setMensaje('No pude conectarme con el servidor');
      console.log('Error al restablecer:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.contenido}>
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.botonVolverTexto}>←</Text>
        </TouchableOpacity>

        <View style={estilos.header}>
          <Text style={estilos.titulo}>Recuperar cuenta</Text>
          <Text style={estilos.subtitulo}>
            Escribi el mail de tu cuenta. Te mandamos un codigo y despues elegis una nueva contrasena.
          </Text>
        </View>

        <View style={estilos.formulario}>
          <Campo
            label="Mail de tu cuenta"
            placeholder="maria@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={pedirCodigo} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={estilos.botonPrincipal}
            >
              <Text style={estilos.textoBotonPrincipal}>
                {codigoEnviado ? 'Reenviar codigo al mail' : 'Enviar codigo al mail'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {codigoEnviado && (
            <View style={estilos.restablecerBox}>
              <Campo
                label="Codigo"
                placeholder="Codigo recibido"
                value={codigo}
                onChangeText={setCodigo}
                autoCapitalize="none"
              />

              <Campo
                label="Nueva contrasena"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity onPress={restablecerPassword} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#2563EB', '#22C55E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={estilos.botonPrincipal}
                >
                  <Text style={estilos.textoBotonPrincipal}>Actualizar contrasena</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <Text style={estilos.mensaje}>{mensaje}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Campo({ label, ...props }) {
  return (
    <View style={estilos.campoBox}>
      <Text style={estilos.label}>{label}</Text>
      <View style={estilos.inputBox}>
        <TextInput
          {...props}
          style={estilos.input}
          placeholderTextColor="#7F8EA3"
        />
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

  header: {
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
    lineHeight: 20,
  },

  formulario: {
    marginTop: 26,
  },

  campoBox: {
    marginBottom: 12,
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
    justifyContent: 'center',
  },

  input: {
    color: '#FFFFFF',
    fontSize: 15,
    outlineStyle: 'none',
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  restablecerBox: {
    marginTop: 20,
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 14,
    lineHeight: 20,
  },
});
