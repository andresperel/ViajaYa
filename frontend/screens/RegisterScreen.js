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
import { API_URL } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [nombreIngresado, setNombreIngresado] = useState('');
  const [telefonoIngresado, setTelefonoIngresado] = useState('');
  const [correoIngresado, setCorreoIngresado] = useState('');
  const [passwordIngresada, setPasswordIngresada] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [mostrarPoliticas, setMostrarPoliticas] = useState(false);

  const [errorNombre, setErrorNombre] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  const limpiarErrores = () => {
    setMensajeEnPantalla('');
    setErrorNombre('');
    setErrorTelefono('');
    setErrorCorreo('');
    setErrorPassword('');
  };

  const manejarRegistroUsuario = async () => {
    limpiarErrores();

    const nombreLimpio = nombreIngresado.trim();
    const telefonoLimpio = telefonoIngresado.replace(/\D/g, '');
    const correoLimpio = correoIngresado.trim().toLowerCase();
    const passwordLimpia = passwordIngresada.trim();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hayError = false;

    if (!nombreLimpio) {
      setErrorNombre('Completa tu nombre');
      hayError = true;
    } else if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      setErrorNombre('El nombre debe tener entre 3 y 50 caracteres');
      hayError = true;
    }

    if (!correoLimpio) {
      setErrorCorreo('Completa tu correo electronico');
      hayError = true;
    } else if (!emailValido.test(correoLimpio)) {
      setErrorCorreo('Ingresa un email valido');
      hayError = true;
    } else if (correoLimpio.length > 100) {
      setErrorCorreo('El email es demasiado largo');
      hayError = true;
    }

    if (!telefonoLimpio) {
      setErrorTelefono('Completa tu telefono');
      hayError = true;
    } else if (!/^\d{8,15}$/.test(telefonoLimpio)) {
      setErrorTelefono('El telefono debe tener entre 8 y 15 numeros');
      hayError = true;
    }

    if (!passwordLimpia) {
      setErrorPassword('Completa tu contrasena');
      hayError = true;
    } else if (passwordLimpia.length < 6 || passwordLimpia.length > 30) {
      setErrorPassword('La contrasena debe tener entre 6 y 30 caracteres');
      hayError = true;
    }

    if (!aceptoTerminos) {
      setMensajeEnPantalla('Acepta los terminos para crear tu cuenta');
      hayError = true;
    }

    if (hayError) return;

    try {
      setMensajeEnPantalla('Creando cuenta...');

      const respuestaDelServidor = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          nombre: nombreLimpio,
          telefono: telefonoLimpio,
          email: correoLimpio,
          password: passwordLimpia,
        }),
      });

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        setMensajeEnPantalla('Cuenta creada correctamente');

        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);
      } else {
        const mensajeError =
          datosRecibidos.detalle || datosRecibidos.mensaje || 'Error al registrar';

        if (mensajeError.toLowerCase().includes('email')) {
          setErrorCorreo(mensajeError);
        } else if (mensajeError.toLowerCase().includes('nombre')) {
          setErrorNombre(mensajeError);
        } else if (mensajeError.toLowerCase().includes('telefono')) {
          setErrorTelefono(mensajeError);
        } else if (mensajeError.toLowerCase().includes('contrasena')) {
          setErrorPassword(mensajeError);
        } else {
          setMensajeEnPantalla(mensajeError);
        }
      }
    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error de conexion:', error);
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

        <View style={estilos.headerRegistro}>
          <Text style={estilos.titulo}>Crear cuenta</Text>
          <Text style={estilos.subtitulo}>Toma menos de un minuto. Sin tarjeta.</Text>
        </View>

        <View style={estilos.formulario}>
          <Campo
            icono="👤"
            label="Nombre completo"
            placeholder="Maria Gonzalez"
            value={nombreIngresado}
            onChangeText={(texto) => {
              setNombreIngresado(texto);
              setErrorNombre('');
            }}
            error={errorNombre}
          />

          <Campo
            icono="✉️"
            label="Correo electronico"
            placeholder="maria@ejemplo.com"
            value={correoIngresado}
            onChangeText={(texto) => {
              setCorreoIngresado(texto);
              setErrorCorreo('');
            }}
            error={errorCorreo}
            autoCapitalize="none"
          />

          <Campo
            icono="📱"
            label="Telefono"
            placeholder="+54 11 0000 0000"
            value={telefonoIngresado}
            onChangeText={(texto) => {
              setTelefonoIngresado(texto);
              setErrorTelefono('');
            }}
            error={errorTelefono}
            keyboardType="phone-pad"
          />

          <Campo
            icono="🔒"
            label="Contrasena"
            placeholder="Minimo 6 caracteres"
            value={passwordIngresada}
            onChangeText={(texto) => {
              setPasswordIngresada(texto);
              setErrorPassword('');
            }}
            error={errorPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={estilos.terminosBox}
            activeOpacity={0.85}
            onPress={() => setAceptoTerminos((valorActual) => !valorActual)}
          >
            {aceptoTerminos ? (
              <LinearGradient
                colors={['#2563EB', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={estilos.checkBox}
              >
                <Text style={estilos.checkTexto}>✓</Text>
              </LinearGradient>
            ) : (
              <View style={[estilos.checkBox, estilos.checkBoxVacio]} />
            )}

            <Text style={estilos.terminosTexto}>
              Acepto los <Text style={estilos.terminosBlanco}>terminos y condiciones</Text> y la{' '}
              <Text style={estilos.terminosBlanco}>politica de privacidad</Text>.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMostrarPoliticas((valorActual) => !valorActual)}
          >
            <Text style={estilos.leerMas}>
              {mostrarPoliticas ? 'Ocultar' : 'Leer mas'}
            </Text>
          </TouchableOpacity>

          {mostrarPoliticas && (
            <View style={estilos.politicasBox}>
              <Text style={estilos.politicasTexto}>
                ViajaYa usa tus datos para crear tu cuenta, iniciar sesion, guardar tus viajes y
                mostrarte opciones de movilidad. No compartimos tu contrasena y podes pedir cambios
                o eliminacion de tus datos desde soporte.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={manejarRegistroUsuario} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={estilos.botonPrincipal}
            >
              <Text style={estilos.textoBotonPrincipal}>Crear cuenta</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>
        </View>

        <TouchableOpacity
          style={estilos.loginBox}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.loginTexto}>
            ¿Ya tenes cuenta? <Text style={estilos.loginLink}>Iniciar sesion</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Campo({
  icono,
  label,
  error,
  ...props
}) {
  return (
    <View style={estilos.campoBox}>
      <Text style={estilos.label}>{label}</Text>

      <View style={[estilos.inputBox, error !== '' && estilos.inputBoxError]}>
        <Text style={estilos.inputIcono}>{icono}</Text>
        <TextInput
          {...props}
          style={estilos.input}
          placeholderTextColor="#7F8EA3"
        />
      </View>

      {error !== '' && (
        <Text style={estilos.errorTexto}>{error}</Text>
      )}
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

  headerRegistro: {
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
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputBoxError: {
    borderColor: '#EF4444',
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

  errorTexto: {
    color: '#EF4444',
    fontSize: 11,
    marginLeft: 4,
    marginTop: 6,
    fontWeight: '600',
  },

  terminosBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  checkBoxVacio: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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

  terminosBlanco: {
    color: '#FFFFFF',
  },

  leerMas: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 32,
    marginTop: 4,
  },

  politicasBox: {
    marginLeft: 32,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  politicasTexto: {
    color: '#B8C1CC',
    fontSize: 11,
    lineHeight: 17,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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

  loginBox: {
    marginTop: 'auto',
    paddingTop: 22,
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
