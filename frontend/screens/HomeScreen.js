import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

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
  const usuario = route?.params?.usuario;

  const [origenIngresado, setOrigenIngresado] = useState('');
  const [destinoIngresado, setDestinoIngresado] = useState('');
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

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
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={estilos.avatar}
            >
              <Text style={estilos.avatarTexto}>
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </Text>
            </LinearGradient>

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
          <View style={estilos.badgeHero}>
            <Text style={estilos.badgeHeroTexto}>✨ Comparador inteligente</Text>
          </View>

          <Text style={estilos.titulo}>¿A dónde vamos hoy?</Text>

          <Text style={estilos.subtitulo}>
            Compará Uber, Didi y Cabify en segundos.
          </Text>
        </View>

        <LinearGradient
          colors={['rgba(37,99,235,0.80)', 'rgba(34,197,94,0.80)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.cardBorde}
        >
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
        </LinearGradient>

        <TouchableOpacity
          onPress={manejarBusquedaViaje}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.botonPrincipal}
          >
            <Text style={estilos.textoBotonPrincipal}>
              🔎 Comparar viajes
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>

        <LinearGradient
          colors={['rgba(37,99,235,0.18)', 'rgba(34,197,94,0.14)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.promoCard}
        >
          <View style={estilos.iconoPromo}>
            <Text style={estilos.iconoPromoTexto}>🏷️</Text>
          </View>

          <View style={estilos.promoTextoBox}>
            <Text style={estilos.promoTitulo}>API integrada ✅</Text>
            <Text style={estilos.promoSubtitulo}>
              Distancia y tiempo calculados con OpenRouteService
            </Text>
          </View>

          <Text style={estilos.rayo}>⚡</Text>
        </LinearGradient>

        <View style={estilos.gridAccesos}>
          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() => navigation.navigate('MisViajes', { usuario })}
            activeOpacity={0.85}
          >
            <View style={estilos.accesoIconoBox}>
              <Text style={estilos.accesoIcono}>🚗</Text>
            </View>
            <Text style={estilos.accesoTitulo}>Mis viajes</Text>
            <Text style={estilos.accesoSubtitulo}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() => navigation.navigate('Perfil', { usuario })}
            activeOpacity={0.85}
          >
            <View style={estilos.accesoIconoBox}>
              <Text style={estilos.accesoIcono}>👤</Text>
            </View>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },

  avatarTexto: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  campana: {
    fontSize: 18,
  },

  puntoVerde: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    position: 'absolute',
    top: 9,
    right: 9,
    shadowColor: '#22C55E',
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  hero: {
    marginTop: 34,
  },

  badgeHero: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },

  badgeHeroTexto: {
    color: '#B8C1CC',
    fontSize: 11,
    fontWeight: '600',
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitulo: {
    color: '#B8C1CC',
    fontSize: 15,
    marginTop: 7,
  },

  cardBorde: {
    marginTop: 24,
    borderRadius: 28,
    padding: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },

  cardBusqueda: {
    backgroundColor: '#152A4D',
    borderRadius: 27,
    padding: 18,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  lineaMapa: {
    width: 22,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
    marginRight: 12,
  },

  puntoOrigen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  lineaVertical: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.20)',
    marginVertical: 8,
  },

  puntoDestino: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },

  inputsBox: {
    flex: 1,
  },

  inputGrupo: {
    paddingVertical: 6,
  },

  labelInput: {
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 6,
    fontWeight: '700',
  },

  input: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
    outlineStyle: 'none',
  },

  separador: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 6,
  },

  botonPrincipal: {
    marginTop: 18,
    height: 58,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: 'bold',
  },

  promoCard: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconoPromo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    fontWeight: '900',
    fontSize: 14,
  },

  promoSubtitulo: {
    color: '#B8C1CC',
    fontSize: 12,
    marginTop: 4,
  },

  rayo: {
    fontSize: 19,
  },

  gridAccesos: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },

  accesoCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  accesoIconoBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(37,99,235,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  accesoIcono: {
    fontSize: 20,
  },

  accesoTitulo: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    marginTop: 26,
  },
});