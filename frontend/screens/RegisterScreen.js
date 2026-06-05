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

export default function RegisterScreen({ navigation }) {
  const [nombreIngresado, setNombreIngresado] = useState('');
  const [telefonoIngresado, setTelefonoIngresado] = useState('');
  const [correoIngresado, setCorreoIngresado] = useState('');
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  const [errorNombre, setErrorNombre] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [errorCorreo, setErrorCorreo] = useState('');
  const [errorContraseña, setErrorContraseña] = useState('');

  const limpiarErrores = () => {
    setMensajeEnPantalla('');
    setErrorNombre('');
    setErrorTelefono('');
    setErrorCorreo('');
    setErrorContraseña('');
  };

  const manejarRegistroUsuario = async () => {
    limpiarErrores();

    const nombreLimpio = nombreIngresado.trim();
    const telefonoLimpio = telefonoIngresado.trim();
    const correoLimpio = correoIngresado.trim().toLowerCase();
    const contraseñaLimpia = contraseñaIngresada.trim();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hayError = false;

    if (!nombreLimpio) {
      setErrorNombre('Completá tu nombre');
      hayError = true;
    } else if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
      setErrorNombre('El nombre debe tener entre 3 y 50 caracteres');
      hayError = true;
    }

    if (!correoLimpio) {
      setErrorCorreo('Completá tu correo electrónico');
      hayError = true;
    } else if (!emailValido.test(correoLimpio)) {
      setErrorCorreo('Ingresá un email válido');
      hayError = true;
    } else if (correoLimpio.length > 100) {
      setErrorCorreo('El email es demasiado largo');
      hayError = true;
    }

    if (!telefonoLimpio) {
      setErrorTelefono('Completá tu teléfono');
      hayError = true;
    } else if (!/^\d{8,15}$/.test(telefonoLimpio)) {
      setErrorTelefono('El teléfono debe tener entre 8 y 15 números');
      hayError = true;
    }

    if (!contraseñaLimpia) {
      setErrorContraseña('Completá tu contraseña');
      hayError = true;
    } else if (contraseñaLimpia.length < 4 || contraseñaLimpia.length > 30) {
      setErrorContraseña('La contraseña debe tener entre 4 y 30 caracteres');
      hayError = true;
    }

    if (hayError) return;

    try {
      setMensajeEnPantalla('Creando cuenta...');

      const respuestaDelServidor = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreLimpio,
          telefono: telefonoLimpio,
          email: correoLimpio,
          password: contraseñaLimpia,
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
        } else if (
          mensajeError.toLowerCase().includes('teléfono') ||
          mensajeError.toLowerCase().includes('telefono')
        ) {
          setErrorTelefono(mensajeError);
        } else if (mensajeError.toLowerCase().includes('contraseña')) {
          setErrorContraseña(mensajeError);
        } else {
          setMensajeEnPantalla(mensajeError);
        }
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
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.progresoActivo}
          />
          <View style={estilos.progresoInactivo} />
          <View style={estilos.progresoInactivo} />
        </View>

        <Text style={estilos.paso}>Paso 1 de 3</Text>
        <Text style={estilos.titulo}>Crear cuenta</Text>
        <Text style={estilos.subtitulo}>Toma menos de un minuto. Sin tarjeta.</Text>

        <View style={estilos.formulario}>
          <Text style={estilos.label}>Nombre completo</Text>
          <View style={[estilos.inputBox, errorNombre !== '' && estilos.inputBoxError]}>
            <Text style={estilos.inputIcono}>👤</Text>
            <TextInput
              style={estilos.input}
              placeholder="María González"
              placeholderTextColor="#7F8EA3"
              value={nombreIngresado}
              onChangeText={(texto) => {
                setNombreIngresado(texto);
                setErrorNombre('');
              }}
            />
          </View>
          {errorNombre !== '' && <Text style={estilos.errorTexto}>{errorNombre}</Text>}

          <Text style={estilos.label}>Correo electrónico</Text>
          <View style={[estilos.inputBox, errorCorreo !== '' && estilos.inputBoxError]}>
            <Text style={estilos.inputIcono}>✉️</Text>
            <TextInput
              style={estilos.input}
              placeholder="maria@ejemplo.com"
              placeholderTextColor="#7F8EA3"
              autoCapitalize="none"
              value={correoIngresado}
              onChangeText={(texto) => {
                setCorreoIngresado(texto);
                setErrorCorreo('');
              }}
            />
          </View>
          {errorCorreo !== '' && <Text style={estilos.errorTexto}>{errorCorreo}</Text>}

          <Text style={estilos.label}>Teléfono</Text>
          <View style={[estilos.inputBox, errorTelefono !== '' && estilos.inputBoxError]}>
            <Text style={estilos.inputIcono}>📱</Text>
            <TextInput
              style={estilos.input}
              placeholder="1122334455"
              placeholderTextColor="#7F8EA3"
              keyboardType="numeric"
              value={telefonoIngresado}
              onChangeText={(texto) => {
                setTelefonoIngresado(texto);
                setErrorTelefono('');
              }}
            />
          </View>
          {errorTelefono !== '' && <Text style={estilos.errorTexto}>{errorTelefono}</Text>}

          <Text style={estilos.label}>Contraseña</Text>
          <View style={[estilos.inputBox, errorContraseña !== '' && estilos.inputBoxError]}>
            <Text style={estilos.inputIcono}>🔒</Text>
            <TextInput
              style={estilos.input}
              placeholder="Mínimo 4 caracteres"
              placeholderTextColor="#7F8EA3"
              secureTextEntry
              value={contraseñaIngresada}
              onChangeText={(texto) => {
                setContraseñaIngresada(texto);
                setErrorContraseña('');
              }}
            />
          </View>
          {errorContraseña !== '' && (
            <Text style={estilos.errorTexto}>{errorContraseña}</Text>
          )}

          <View style={estilos.terminosBox}>
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={estilos.checkBox}
            >
              <Text style={estilos.checkTexto}>✓</Text>
            </LinearGradient>

            <Text style={estilos.terminosTexto}>
              Acepto los términos y condiciones y la política de privacidad.
            </Text>
          </View>

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
    borderColor: 'rgba(37,99,235,0.25)',
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.22)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  inputBoxError: {
    borderColor: '#EF4444',
    marginBottom: 5,
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
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 12,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563EB',
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