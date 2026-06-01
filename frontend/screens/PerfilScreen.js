// Importo React para crear la pantalla.
import React from 'react';

// Importo los componentes que necesito para mostrar el perfil.
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla muestra los datos del usuario que inició sesión.
export default function PerfilScreen({ navigation, route }) {

  // Recibo el usuario que mandé desde Home.
  const usuario = route.params?.usuario;

  // Si por algún motivo no llegó el usuario, muestro una pantalla simple y no rompo la app.
  if (!usuario) {
    return (
      <SafeAreaView style={estilos.container}>

        <Text style={estilos.titulo}>
          Mi perfil
        </Text>

        <View style={estilos.tarjeta}>
          <Text style={estilos.nombre}>
            No pude cargar los datos del usuario
          </Text>

          <Text style={estilos.dato}>
            Volvé a iniciar sesión para ver tu perfil.
          </Text>
        </View>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.textoBoton}>
            Volver al login
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        Mi perfil
      </Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.inicial}>
          {usuario.nombre.charAt(0).toUpperCase()}
        </Text>

        <Text style={estilos.nombre}>
          {usuario.nombre}
        </Text>

        <Text style={estilos.dato}>
          📧 {usuario.email}
        </Text>

        <Text style={estilos.dato}>
          📱 {usuario.telefono}
        </Text>
      </View>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => navigation.navigate('Home', { usuario: usuario })}
      >
        <Text style={estilos.textoBoton}>
          Volver al inicio
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },

  tarjeta: {
    backgroundColor: '#0A2A66',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 25,
  },

  inicial: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1DD1A1',
    color: '#041B45',
    fontSize: 38,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 80,
    marginBottom: 18,
  },

  nombre: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },

  dato: {
    color: '#B8C1CC',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 15,
    borderRadius: 12,
  },

  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

});