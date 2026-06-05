// Importo React y useState para manejar los datos escritos por el usuario.
import React, { useState } from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function HomeScreen({ navigation, route }) {

  // Recibo el usuario logueado.
  const usuario = route?.params?.usuario;

  const [origenIngresado, setOrigenIngresado] = useState('');
  const [destinoIngresado, setDestinoIngresado] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función llama a la API del backend para calcular distancia, tiempo y precios.
  const manejarBusquedaViaje = async () => {
    setMensajeEnPantalla('');

    if (!usuario) {
      setMensajeEnPantalla('Volvé a iniciar sesión para continuar');
      return;
    }

    if (!origenIngresado || !destinoIngresado) {
      setMensajeEnPantalla('Completá origen y destino');
      return;
    }

    try {
      setMensajeEnPantalla('Calculando viaje...');

      const respuestaDelServidor = await fetch(
        'http://localhost:3000/calcular-viaje',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origen: origenIngresado,
            destino: destinoIngresado,
          }),
        }
      );

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        navigation.navigate('Resultados', {
          origenIngresado,
          destinoIngresado,
          usuario,
          datosViaje: datosRecibidos,
        });
      } else {
        setMensajeEnPantalla(datosRecibidos.mensaje || 'No pude calcular el viaje');
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error al calcular viaje:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >

        <View style={estilos.header}>
          <View style={estilos.usuarioBox}>
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTexto}>
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View>
              <Text style={estilos.saludoChico}>Buenas tardes</Text>
              <Text style={estilos.nombreUsuario}>
                {usuario?.nombre || 'Usuario'}
              </Text>
            </View>
          </View>

          <View style={estilos.botonCampana}>
            <Text style={estilos.campana}>🔔</Text>
            <View style={estilos.puntoVerde} />
          </View>
        </View>

        <View style={estilos.hero}>
          <Text style={estilos.titulo}>¿A dónde vamos?</Text>
          <Text style={estilos.subtitulo}>
            Compará en segundos. Pagá menos.
          </Text>
        </View>

        <View style={estilos.cardBusqueda}>
          <View style={estilos.lineaMapa}>
            <View style={estilos.puntoOrigen} />
            <View style={estilos.lineaVertical} />
            <View style={estilos.puntoDestino} />
          </View>

          <View style={estilos.inputsBox}>
            <View style={estilos.inputGrupo}>
              <Text style={estilos.labelInput}>ORIGEN</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: ORT Yatay Buenos Aires"
                placeholderTextColor="#7F8EA3"
                value={origenIngresado}
                onChangeText={setOrigenIngresado}
              />
            </View>

            <View style={estilos.separador} />

            <View style={estilos.inputGrupo}>
              <Text style={estilos.labelInput}>DESTINO</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: Alto Palermo Buenos Aires"
                placeholderTextColor="#7F8EA3"
                value={destinoIngresado}
                onChangeText={setDestinoIngresado}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={estilos.botonPrincipal}
          onPress={manejarBusquedaViaje}
        >
          <Text style={estilos.textoBotonPrincipal}>🔎 Comparar viajes</Text>
        </TouchableOpacity>

        <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>

        <View style={estilos.promoCard}>
          <Text style={estilos.promoTitulo}>API integrada ✅</Text>
          <Text style={estilos.promoSubtitulo}>
            Distancia y tiempo calculados con OpenRouteService
          </Text>
        </View>

        <View style={estilos.gridAccesos}>
          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() => navigation.navigate('MisViajes', { usuario })}
          >
            <Text style={estilos.accesoIcono}>🚗</Text>
            <Text style={estilos.accesoTitulo}>Mis viajes</Text>
            <Text style={estilos.accesoSubtitulo}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() => navigation.navigate('Perfil', { usuario })}
          >
            <Text style={estilos.accesoIcono}>👤</Text>
            <Text style={estilos.accesoTitulo}>Perfil</Text>
            <Text style={estilos.accesoSubtitulo}>Mi cuenta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={estilos.cerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1F3A',
  },

  contenido: {
    padding: 24,
    paddingBottom: 40,
  },

  header: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  usuarioBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarTexto: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  saludoChico: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  nombreUsuario: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botonCampana: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  campana: {
    fontSize: 18,
  },

  puntoVerde: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    position: 'absolute',
    top: 9,
    right: 9,
  },

  hero: {
    marginTop: 34,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },

  subtitulo: {
    color: '#B8C1CC',
    fontSize: 15,
    marginTop: 6,
  },

  cardBusqueda: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
  },

  lineaMapa: {
    width: 22,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    marginRight: 12,
  },

  puntoOrigen: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  lineaVertical: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginVertical: 6,
  },

  puntoDestino: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },

  inputsBox: {
    flex: 1,
  },

  inputGrupo: {
    paddingVertical: 6,
  },

  labelInput: {
    color: '#9CA3AF',
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  input: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    outlineStyle: 'none',
  },

  separador: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 5,
  },

  botonPrincipal: {
    marginTop: 16,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: 'bold',
  },

  promoCard: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  promoTitulo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  promoSubtitulo: {
    color: '#B8C1CC',
    fontSize: 12,
    marginTop: 4,
  },

  gridAccesos: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },

  accesoCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  accesoIcono: {
    fontSize: 22,
    marginBottom: 10,
  },

  accesoTitulo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  accesoSubtitulo: {
    color: '#B8C1CC',
    fontSize: 11,
    marginTop: 3,
  },

  cerrarSesion: {
    color: '#B8C1CC',
    textAlign: 'center',
    marginTop: 24,
  },
});