import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={estilos.fondo}>
      <View style={estilos.pantallaMobile}>
        <View style={estilos.heroMarcaBox}>
          <Text style={estilos.marcaTexto}>
            <Text style={estilos.marcaViaja}>viaja</Text>
            <Text style={estilos.marcaYaInicio}>Y</Text>
            <Text style={estilos.marcaYaFinal}>A</Text>
          </Text>
        </View>

        <View style={estilos.bottom}>
          <View style={estilos.tituloFila}>
            <Text style={estilos.titulo}>Movete </Text>
            <Text style={estilos.tituloGradiente}>
              <Text style={estilos.mejorInicio}>me</Text>
              <Text style={estilos.mejorMedio}>j</Text>
              <Text style={estilos.mejorFinal}>or</Text>
            </Text>
            <Text style={estilos.titulo}>.</Text>
          </View>

          <Text style={estilos.subtitulo}>
            Compara Uber, Didi y Cabify en una sola busqueda.
          </Text>

          <View style={estilos.zonaBotones}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Register')}
            >
              <LinearGradient
                colors={['#2563EB', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={estilos.botonPrincipal}
              >
                <Text style={estilos.textoBotonPrincipal}>Comenzar</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonSecundario}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={estilos.textoBotonSecundario}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#0F1F3A',
    alignItems: 'center',
  },

  pantallaMobile: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#0F1F3A',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 34,
  },

  heroMarcaBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 390,
  },

  marcaTexto: {
    color: '#FFFFFF',
    fontSize: 64,
    lineHeight: 70,
    fontWeight: '900',
  },

  marcaViaja: {
    color: '#FFFFFF',
  },

  marcaYaInicio: {
    color: '#2563EB',
  },

  marcaYaFinal: {
    color: '#22C55E',
  },

  bottom: {
    paddingTop: 30,
  },

  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
  },

  tituloGradiente: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
  },

  mejorInicio: {
    color: '#2563EB',
  },

  mejorMedio: {
    color: '#1FAE9A',
  },

  mejorFinal: {
    color: '#22C55E',
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 310,
  },

  zonaBotones: {
    marginTop: 28,
    gap: 12,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  botonSecundario: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  textoBotonSecundario: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
