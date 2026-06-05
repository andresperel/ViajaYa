import React, { useState } from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function ResultadosScreen({ navigation, route }) {
  const {
    origenIngresado,
    destinoIngresado,
    usuario,
    datosViaje,
  } = route.params;

  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');

  const opciones = datosViaje?.opciones || [];

  const elegirViaje = async (oferta) => {
    setMensajeEnPantalla('');

    if (!usuario) {
      setMensajeEnPantalla('No se encontró el usuario logueado');
      return;
    }

    try {
      setMensajeEnPantalla('Guardando viaje...');

      const respuestaDelServidor = await fetch(
        'http://localhost:3000/viaje',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            calleOrigen: origenIngresado,
            calleDestino: destinoIngresado,
            precioEstimado: oferta.precio,
            tiempoEstimado: oferta.tiempoEstimado,
            idUsuario: usuario.idUsuario,
            idTipoServicio: oferta.idTipoServicio,
          }),
        }
      );

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        navigation.navigate('ViajeConfirmado', {
          empresaElegida: oferta.empresa,
          precioElegido: oferta.precio,
          usuario,
        });
      } else {
        setMensajeEnPantalla(
          datosRecibidos.detalle || datosRecibidos.mensaje || 'Error al guardar viaje'
        );
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error al guardar viaje:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
      >

        <View style={estilos.header}>
          <TouchableOpacity
            style={estilos.botonCircular}
            onPress={() => navigation.navigate('Home', { usuario })}
          >
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View style={estilos.headerTexto}>
            <Text style={estilos.rutaChica}>
              {origenIngresado} → {destinoIngresado}
            </Text>

            <Text style={estilos.tituloHeader}>
              {opciones.length} viajes encontrados · {datosViaje?.distanciaKm} km
            </Text>
          </View>

          <View style={estilos.botonCircular}>
            <Text style={estilos.filtro}>☰</Text>
          </View>
        </View>

        <View style={estilos.resumenCard}>
          <Text style={estilos.resumenTitulo}>Ruta calculada con API real</Text>
          <Text style={estilos.resumenTexto}>
            {datosViaje?.origenEncontrado}
          </Text>
          <Text style={estilos.resumenTexto}>
            → {datosViaje?.destinoEncontrado}
          </Text>
          <Text style={estilos.resumenDato}>
            {datosViaje?.distanciaKm} km · {datosViaje?.duracionMin} min aprox.
          </Text>
        </View>

        <View style={estilos.lista}>
          {opciones.map((oferta, index) => (
            <TouchableOpacity
              key={index}
              style={[
                estilos.cardOferta,
                index === 0 && estilos.cardDestacada,
              ]}
              activeOpacity={0.85}
              onPress={() => elegirViaje(oferta)}
            >

              <View
                style={[
                  estilos.logoEmpresa,
                  oferta.empresa === 'Uber' && estilos.logoUber,
                  oferta.empresa === 'Didi' && estilos.logoDidi,
                  oferta.empresa === 'Cabify' && estilos.logoCabify,
                ]}
              >
                <Text style={estilos.logoTexto}>
                  {oferta.empresa.charAt(0)}
                </Text>
              </View>

              <View style={estilos.infoOferta}>
                <Text style={estilos.nombreEmpresa}>
                  {oferta.empresa}
                  <Text style={estilos.tipoServicio}> · {oferta.tipo}</Text>
                </Text>

                <Text style={estilos.detalleTexto}>
                  {oferta.tiempoEstimado} min viaje · calculado por API
                </Text>

                {index === 0 && (
                  <View style={estilos.badge}>
                    <Text style={estilos.badgeTexto}>💸 Más barato</Text>
                  </View>
                )}
              </View>

              <View style={estilos.precioBox}>
                <Text style={estilos.precio}>
                  ${oferta.precio.toLocaleString('es-AR')}
                </Text>

                <View style={estilos.botonElegir}>
                  <Text style={estilos.textoElegir}>Elegir</Text>
                </View>
              </View>

            </TouchableOpacity>
          ))}
        </View>

        <Text style={estilos.mensaje}>
          {mensajeEnPantalla}
        </Text>

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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  botonCircular: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  flecha: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  filtro: {
    color: '#FFFFFF',
    fontSize: 20,
  },

  headerTexto: {
    flex: 1,
    marginHorizontal: 12,
  },

  rutaChica: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  tituloHeader: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 3,
  },

  resumenCard: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },

  resumenTitulo: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  resumenTexto: {
    color: '#B8C1CC',
    fontSize: 12,
    marginBottom: 3,
  },

  resumenDato: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },

  lista: {
    marginTop: 18,
  },

  cardOferta: {
    minHeight: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardDestacada: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: '#22C55E',
  },

  logoEmpresa: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  logoUber: {
    backgroundColor: '#000000',
  },

  logoDidi: {
    backgroundColor: '#FF7A00',
  },

  logoCabify: {
    backgroundColor: '#7B61FF',
  },

  logoTexto: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  infoOferta: {
    flex: 1,
  },

  nombreEmpresa: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  tipoServicio: {
    color: '#B8C1CC',
    fontWeight: '400',
  },

  detalleTexto: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: 9,
    paddingHorizontal: 9,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
  },

  badgeTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  precioBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  precio: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  botonElegir: {
    marginTop: 10,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoElegir: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
});