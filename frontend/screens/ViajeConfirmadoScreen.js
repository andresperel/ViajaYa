// Importo React.
import React from 'react';

// Importo los componentes que voy a usar.
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

// Esta pantalla muestra que el viaje fue elegido correctamente.
export default function ViajeConfirmadoScreen({ navigation, route }) {

  // Recibo los datos del viaje elegido.
  const { empresaElegida, precioElegido } = route.params;

  // Esta función abre la app o web de la empresa elegida.
  const abrirAplicacionDeViaje = () => {

    // Si el usuario eligió Uber, abro el link de Uber.
    if (empresaElegida === 'Uber') {

      // Por ahora uso un link general de Uber.
      const linkDeUber = 'https://m.uber.com/ul/';

      Linking.openURL(linkDeUber);
      return;
    }

    // Si el usuario eligió Cabify, abro la web de Cabify.
    if (empresaElegida === 'Cabify') {

      const linkDeCabify = 'https://cabify.com/';

      Linking.openURL(linkDeCabify);
      return;
    }

    // Si el usuario eligió Didi, abro la web de Didi.
    if (empresaElegida === 'Didi') {

      const linkDeDidi = 'https://web.didiglobal.com/';

      Linking.openURL(linkDeDidi);
      return;
    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.icono}>
        ✅
      </Text>

      <Text style={estilos.titulo}>
        ¡Viaje confirmado!
      </Text>

      <Text style={estilos.texto}>
        Elegiste viajar con {empresaElegida}
      </Text>

      <Text style={estilos.precio}>
        Precio estimado: ${precioElegido}
      </Text>

      <TouchableOpacity
        style={estilos.boton}
        onPress={abrirAplicacionDeViaje}
      >
        <Text style={estilos.textoBoton}>
          Continuar en {empresaElegida}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={estilos.link}>
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

  icono: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 20,
  },

  titulo: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  texto: {
    color: '#B8C1CC',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },

  precio: {
    color: '#1DD1A1',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 15,
    borderRadius: 12,
  },

  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  link: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },

});