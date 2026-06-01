// Importo React para crear la pantalla inicial.
import React from 'react';

// Importo componentes de React Native para armar una pantalla mobile profesional.
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

// Esta es la pantalla inicial de ViajaYA.
export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={estilos.fondo}>

      {/* Uso este contenedor para que en web también se vea como pantalla mobile. */}
      <View style={estilos.pantallaMobile}>

        {/* Parte superior con logo. */}
        <View style={estilos.zonaLogo}>
          <Image
            source={require('../assets/logo-viajaya.png')}
            style={estilos.logoImagen}
            resizeMode="contain"
          />

          <Text style={estilos.frasePrincipal}>
            Tu viaje, al instante.
          </Text>

          <Text style={estilos.fraseSecundaria}>
            Compará opciones. Elegí mejor. Viajá simple.
          </Text>
        </View>

        {/* Simulo una ciudad/mapa con líneas sutiles para que no quede vacío. */}
        <View style={estilos.zonaVisual}>
          <View style={estilos.lineaMapaUno} />
          <View style={estilos.lineaMapaDos} />
          <View style={estilos.puntoMapa} />
          <Text style={estilos.textoVisual}>
            Encontrá la mejor opción para moverte por la ciudad.
          </Text>
        </View>

        {/* Botones principales. */}
        <View style={estilos.zonaBotones}>
          <TouchableOpacity
            style={estilos.botonPrincipal}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={estilos.textoBotonPrincipal}>
              Iniciar sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.botonSecundario}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={estilos.textoBotonSecundario}>
              Crear cuenta
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({

  fondo: {
    flex: 1,
    backgroundColor: '#071A33',
    alignItems: 'center',
  },

  pantallaMobile: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#071A33',
    paddingHorizontal: 26,
    paddingVertical: 34,
    justifyContent: 'space-between',
  },

  zonaLogo: {
    alignItems: 'center',
    marginTop: 30,
  },

  logoImagen: {
    width: 250,
    height: 110,
    marginBottom: 22,
  },

  frasePrincipal: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  fraseSecundaria: {
    color: '#8EA4BE',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },

  zonaVisual: {
    height: 230,
    borderRadius: 32,
    backgroundColor: '#0B2447',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 24,
    borderWidth: 1,
    borderColor: '#113A70',
  },

  lineaMapaUno: {
    position: 'absolute',
    width: 330,
    height: 2,
    backgroundColor: '#1DD1A1',
    opacity: 0.28,
    transform: [{ rotate: '-28deg' }],
    top: 75,
    left: -40,
  },

  lineaMapaDos: {
    position: 'absolute',
    width: 280,
    height: 2,
    backgroundColor: '#2F80ED',
    opacity: 0.35,
    transform: [{ rotate: '34deg' }],
    top: 115,
    right: -40,
  },

  puntoMapa: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1DD1A1',
    top: 95,
    alignSelf: 'center',
    shadowColor: '#1DD1A1',
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },

  textoVisual: {
    color: 'white',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
  },

  zonaBotones: {
    marginBottom: 18,
  },

  botonPrincipal: {
    backgroundColor: '#1DD1A1',
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  textoBotonPrincipal: {
    color: '#071A33',
    fontSize: 16,
    fontWeight: '800',
  },

  botonSecundario: {
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1DD1A1',
  },

  textoBotonSecundario: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

});