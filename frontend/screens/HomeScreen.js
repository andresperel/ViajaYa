// Importo React y useState para manejar los datos escritos por el usuario.
import React, { useState } from 'react';

// Importo los componentes que necesito para armar la pantalla.
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Esta pantalla es el inicio de la app después de iniciar sesión.
export default function HomeScreen({ navigation, route }) {

  // Recibo el usuario que llegó desde Login.
  const usuario = route?.params?.usuario;

  // Guardo el lugar desde donde sale el usuario.
  const [origenIngresado, setOrigenIngresado] = useState('');

  // Guardo el destino al que quiere ir el usuario.
  const [destinoIngresado, setDestinoIngresado] = useState('');

  // Guardo un mensaje para avisar si falta completar algo.
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  // Esta función se ejecuta cuando presiono "Comparar viajes".
  const manejarBusquedaViaje = () => {
    setMensajeEnPantalla('');

    if (!usuario) {
      setMensajeEnPantalla('Volvé a iniciar sesión para continuar');
      return;
    }

    if (!origenIngresado || !destinoIngresado) {
      setMensajeEnPantalla('Completá origen y destino');
      return;
    }

    navigation.navigate('Resultados', {
      origenIngresado: origenIngresado,
      destinoIngresado: destinoIngresado,
      usuario: usuario,
    });
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
              <Text style={estilos.saludoChico}>
                Buenas tardes
              </Text>

              <Text style={estilos.nombreUsuario}>
                {usuario?.nombre || 'Usuario'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botonCampana}>
            <Text style={estilos.campana}>🔔</Text>
            <View style={estilos.puntoVerde} />
          </TouchableOpacity>
        </View>

        <View style={estilos.hero}>
          <Text style={estilos.titulo}>
            ¿A dónde vamos?
          </Text>

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
                placeholder="¿Desde dónde salís?"
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
                placeholder="¿A dónde vas?"
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
          <Text style={estilos.textoBotonPrincipal}>
            🔎 Comparar viajes
          </Text>
        </TouchableOpacity>

        <Text style={estilos.mensaje}>
          {mensajeEnPantalla}
        </Text>

        <View style={estilos.promoCard}>
          <View style={estilos.iconoPromo}>
            <Text style={estilos.iconoPromoTexto}>🏷️</Text>
          </View>

          <View style={estilos.promoTextoBox}>
            <Text style={estilos.promoTitulo}>
              Ahorrá hasta 30% hoy
            </Text>

            <Text style={estilos.promoSubtitulo}>
              Comparando entre 3 apps al mismo tiempo
            </Text>
          </View>

          <Text style={estilos.rayo}>⚡</Text>
        </View>

        <View style={estilos.seccionHeader}>
          <Text style={estilos.seccionTitulo}>
            Accesos rápidos
          </Text>
        </View>

        <View style={estilos.gridAccesos}>
          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() =>
              navigation.navigate('MisViajes', {
                usuario: usuario,
              })
            }
          >
            <Text style={estilos.accesoIcono}>🚗</Text>
            <Text style={estilos.accesoTitulo}>Mis viajes</Text>
            <Text style={estilos.accesoSubtitulo}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() =>
              navigation.navigate('Perfil', {
                usuario: usuario,
              })
            }
          >
            <Text style={estilos.accesoIcono}>👤</Text>
            <Text style={estilos.accesoTitulo}>Perfil</Text>
            <Text style={estilos.accesoSubtitulo}>Mi cuenta</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.seccionHeader}>
          <Text style={estilos.seccionTitulo}>
            Viajes recientes
          </Text>
        </View>

        <View style={estilos.recienteCard}>
          <View style={estilos.relojBox}>
            <Text>🕘</Text>
          </View>

          <View style={estilos.recienteTexto}>
            <Text style={estilos.recienteLugar}>Aeropuerto Ezeiza</Text>
            <Text style={estilos.recienteMeta}>Ayer · $5.200</Text>
          </View>

          <Text style={estilos.pin}>📍</Text>
        </View>

        <View style={estilos.recienteCard}>
          <View style={estilos.relojBox}>
            <Text>🕘</Text>
          </View>

          <View style={estilos.recienteTexto}>
            <Text style={estilos.recienteLugar}>Parque Centenario</Text>
            <Text style={estilos.recienteMeta}>Lun · $1.850</Text>
          </View>

          <Text style={estilos.pin}>📍</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.cerrarSesion}>
            Cerrar sesión
          </Text>
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
    letterSpacing: -0.5,
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
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoPromo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconoPromoTexto: {
    fontSize: 18,
  },

  promoTextoBox: {
    flex: 1,
  },

  promoTitulo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  promoSubtitulo: {
    color: '#B8C1CC',
    fontSize: 11,
    marginTop: 2,
  },

  rayo: {
    fontSize: 18,
  },

  seccionHeader: {
    marginTop: 26,
    marginBottom: 12,
  },

  seccionTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  gridAccesos: {
    flexDirection: 'row',
    gap: 12,
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

  recienteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },

  relojBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  recienteTexto: {
    flex: 1,
  },

  recienteLugar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  recienteMeta: {
    color: '#B8C1CC',
    fontSize: 11,
    marginTop: 2,
  },

  pin: {
    fontSize: 16,
  },

  cerrarSesion: {
    color: '#B8C1CC',
    textAlign: 'center',
    marginTop: 24,
  },

});