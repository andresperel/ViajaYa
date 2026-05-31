// Importo React.
import React from 'react';

// Importo los componentes que voy a usar.
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

// Esta pantalla muestra las opciones encontradas.
export default function ResultadosScreen({ navigation }) {

  // Esta función se ejecuta cuando elijo una opción de viaje.
  const elegirViaje = (empresaElegida, precioElegido) => {

    // Navego a la pantalla de viaje confirmado y mando los datos elegidos.
    navigation.navigate('ViajeConfirmado', {
      empresaElegida: empresaElegida,
      precioElegido: precioElegido,
    });
  };

  return (
    <SafeAreaView style={estilos.container}>

      <Text style={estilos.titulo}>
        Opciones disponibles
      </Text>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Didi</Text>
        <Text style={estilos.precio}>$4200</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Didi', 4200)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Uber</Text>
        <Text style={estilos.precio}>$4500</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Uber', 4500)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaViaje}>
        <Text style={estilos.nombreEmpresa}>Cabify</Text>
        <Text style={estilos.precio}>$4700</Text>

        <TouchableOpacity
          style={estilos.boton}
          onPress={() => elegirViaje('Cabify', 4700)}
        >
          <Text style={estilos.textoBoton}>Elegir</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#041B45',
    padding: 20,
  },

  titulo: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  tarjetaViaje: {
    backgroundColor: '#0A2A66',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  nombreEmpresa: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  precio: {
    color: '#1DD1A1',
    fontSize: 20,
    marginTop: 10,
    marginBottom: 15,
  },

  boton: {
    backgroundColor: '#1DD1A1',
    padding: 12,
    borderRadius: 10,
  },

  textoBoton: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },

});