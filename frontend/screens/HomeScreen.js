import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../services/api';
import { useApp } from '../context/AppContext';
import BusinessBadge from '../components/BusinessBadge';
import BusinessOverview from '../components/BusinessOverview';
import useBusinessTrips from '../hooks/useBusinessTrips';

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
  const { idioma, notificaciones, modoViajaYa } = useApp();
  const business = modoViajaYa === 'business';
  const businessState = useBusinessTrips(business, usuario?.idUsuario);
  const [motivoViaje, setMotivoViaje] = useState('');
  const ingles = idioma === 'en';

  const [origenIngresado, setOrigenIngresado] = useState('');
  const [destinoIngresado, setDestinoIngresado] = useState('');
  const [origenSeleccionado, setOrigenSeleccionado] = useState(null);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState([]);
  const [sugerenciasDestino, setSugerenciasDestino] = useState([]);
  const [campoActivo, setCampoActivo] = useState(null);
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('');
  const tieneNotificaciones = notificaciones.some((item) => !item.leida);
  const busquedasPendientes = useRef({ origen: {}, destino: {} });

  const cancelarBusqueda = (tipo) => {
    const busqueda = busquedasPendientes.current[tipo];
    clearTimeout(busqueda.timer);
    busqueda.controller?.abort();
    busqueda.timer = null;
    busqueda.controller = null;
  };

  useEffect(() => () => {
    cancelarBusqueda('origen');
    cancelarBusqueda('destino');
  }, []);

  const buscarSugerencias = async (texto, tipo, signal) => {
    if (texto.trim().length < 3) {
      tipo === 'origen' ? setSugerenciasOrigen([]) : setSugerenciasDestino([]);
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/direcciones/sugerencias?q=${encodeURIComponent(texto)}`,
        {
          signal,
          headers: { 'ngrok-skip-browser-warning': '1' },
        }
      );
      const datos = await respuesta.json();

      if (respuesta.ok) {
        tipo === 'origen'
          ? setSugerenciasOrigen(datos.sugerencias || [])
          : setSugerenciasDestino(datos.sugerencias || []);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.log('Error al buscar direcciones:', error);
    }
  };

  const programarBusqueda = (texto, tipo) => {
    cancelarBusqueda(tipo);

    if (texto.trim().length < 3) {
      tipo === 'origen' ? setSugerenciasOrigen([]) : setSugerenciasDestino([]);
      return;
    }

    busquedasPendientes.current[tipo].timer = setTimeout(() => {
      const controller = new AbortController();
      busquedasPendientes.current[tipo].controller = controller;
      buscarSugerencias(texto, tipo, controller.signal);
    }, 650);
  };

  const cambiarOrigen = (texto) => {
    setOrigenIngresado(texto);
    setOrigenSeleccionado(null);
    setCampoActivo('origen');
    programarBusqueda(texto, 'origen');
  };

  const cambiarDestino = (texto) => {
    setDestinoIngresado(texto);
    setDestinoSeleccionado(null);
    setCampoActivo('destino');
    programarBusqueda(texto, 'destino');
  };

  const elegirSugerencia = (sugerencia, tipo) => {
    cancelarBusqueda(tipo);
    if (tipo === 'origen') {
      setOrigenIngresado(sugerencia.label);
      setOrigenSeleccionado(sugerencia);
      setSugerenciasOrigen([]);
    } else {
      setDestinoIngresado(sugerencia.label);
      setDestinoSeleccionado(sugerencia);
      setSugerenciasDestino([]);
    }
    setCampoActivo(null);
  };

  const manejarBusquedaViaje = async () => {
    const clasificacion = { tipoViaje: modoViajaYa, motivoViaje: business ? motivoViaje.trim() : undefined };
    setMensajeEnPantalla('');

    // No dejamos solicitudes del autocompletado compitiendo con el calculo.
    cancelarBusqueda('origen');
    cancelarBusqueda('destino');

    if (!usuario) {
      setMensajeEnPantalla('Volve a iniciar sesion para continuar');
      return;
    }

    if (!origenIngresado || !destinoIngresado) {
      setMensajeEnPantalla('Completa origen y destino');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      setMensajeEnPantalla('Calculando viaje...');

      const respuestaDelServidor = await fetch(`${API_URL}/calcular-viaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          origen: origenIngresado,
          destino: destinoIngresado,
          origenCoordenadas: origenSeleccionado?.coordinates,
          destinoCoordenadas: destinoSeleccionado?.coordinates,
        }),
      });

      const datosRecibidos = await respuestaDelServidor.json();

      if (respuestaDelServidor.ok) {
        navigation.navigate('Resultados', {
          origenIngresado: datosRecibidos.origen?.label || origenIngresado,
          destinoIngresado: datosRecibidos.destino?.label || destinoIngresado,
          usuario,
          datosViaje: datosRecibidos,
          ...clasificacion,
        });
      } else {
        setMensajeEnPantalla(datosRecibidos.mensaje || 'No pude calcular el viaje');
      }
    } catch (error) {
      setMensajeEnPantalla(
        error.name === 'AbortError'
          ? 'El calculo demoro demasiado. Intenta nuevamente.'
          : 'No pude conectarme con el servidor'
      );
      console.log('Error al calcular viaje:', error);
    } finally {
      clearTimeout(timeout);
    }
  };

  const tocarCampana = () => {
    navigation.navigate('Notificaciones', { usuario });
  };

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.header}>
          <View style={estilos.usuarioBox}>
            <LinearGradient
              colors={business ? ['#142D50', '#2563EB'] : ['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={estilos.avatar}
            >
              <Text style={estilos.avatarTexto}>
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </Text>
            </LinearGradient>

            <View>
              <Text style={estilos.saludoChico}>{ingles ? 'Hello' : 'Buenas tardes'}</Text>
              <Text style={estilos.nombreUsuario}>
                {usuario?.nombre || 'Usuario'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={estilos.botonCampana} onPress={tocarCampana}>
            <Text style={estilos.campana}>🔔</Text>
            {tieneNotificaciones && <View style={estilos.puntoVerde} />}
          </TouchableOpacity>
        </View>

        <View style={estilos.hero}>
          {business && <><Text style={estilos.nombreUsuario}>ViajaYa BUSINESS</Text><BusinessBadge /></>}
          <Text style={estilos.titulo}>{business ? (ingles ? 'Where are you going for work?' : '¿A dónde vas por trabajo?') : (ingles ? 'Where are we going?' : '¿A dónde vamos?')}</Text>
          <Text style={estilos.subtitulo}>{business ? 'Compará y organizá tus viajes laborales.' : (ingles ? 'Compare in seconds. Pay less.' : 'Compará en segundos. Pagá menos.')}</Text>
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
                onFocus={() => setCampoActivo('origen')}
                onChangeText={cambiarOrigen}
              />

              {campoActivo === 'origen' && sugerenciasOrigen.length > 0 && (
                <View style={estilos.sugerenciasBox}>
                  {sugerenciasOrigen.slice(0, 8).map((sugerencia, index) => (
                    <TouchableOpacity
                      key={`${sugerencia.label}-${index}`}
                      style={estilos.sugerenciaItem}
                      onPress={() => elegirSugerencia(sugerencia, 'origen')}
                    >
                      <Text style={estilos.sugerenciaIcono}>📍</Text>
                      <Text style={estilos.sugerenciaTexto} numberOfLines={2}>
                        {sugerencia.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={estilos.separador} />

            <View style={estilos.inputGrupo}>
              <Text style={estilos.labelInput}>DESTINO</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej: Alto Palermo Buenos Aires"
                placeholderTextColor="#7F8EA3"
                value={destinoIngresado}
                onFocus={() => setCampoActivo('destino')}
                onChangeText={cambiarDestino}
              />

              {campoActivo === 'destino' && sugerenciasDestino.length > 0 && (
                <View style={estilos.sugerenciasBox}>
                  {sugerenciasDestino.slice(0, 8).map((sugerencia, index) => (
                    <TouchableOpacity
                      key={`${sugerencia.label}-${index}`}
                      style={estilos.sugerenciaItem}
                      onPress={() => elegirSugerencia(sugerencia, 'destino')}
                    >
                      <Text style={estilos.sugerenciaIcono}>📍</Text>
                      <Text style={estilos.sugerenciaTexto} numberOfLines={2}>
                        {sugerencia.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {business && <View style={[estilos.cardBusqueda, { flexDirection: 'column' }]}>
          <Text style={estilos.labelInput}>Motivo del viaje (opcional)</Text>
          <TextInput style={estilos.input} value={motivoViaje} onChangeText={setMotivoViaje} maxLength={200} placeholder="Reunión con cliente" placeholderTextColor="#7F8EA3" />
        </View>}

        <TouchableOpacity onPress={manejarBusquedaViaje} activeOpacity={0.85}>
          <LinearGradient
            colors={business ? ['#142D50', '#2563EB'] : ['#2563EB', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={estilos.botonPrincipal}
          >
            <Text style={estilos.textoBotonPrincipal}>🔎 Comparar viajes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>

        {business ? <><BusinessOverview state={businessState} home /><TouchableOpacity onPress={() => navigation.navigate('DashboardBusiness', { usuario })}><Text style={[estilos.accesoTitulo, { color: '#7DD3FC', marginTop: 16 }]}>Dashboard Business →</Text></TouchableOpacity></> : <LinearGradient
          colors={['rgba(37,99,235,0.18)', 'rgba(34,197,94,0.16)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.promoCard}
        >
          <View style={estilos.iconoPromo}>
            <Text style={estilos.iconoPromoTexto}>🏷️</Text>
          </View>

          <View style={estilos.promoTextoBox}>
            <Text style={estilos.promoTitulo}>Ahorra hasta 30% hoy</Text>
            <Text style={estilos.promoSubtitulo}>Comparando entre 3 apps al mismo tiempo</Text>
          </View>

          <Text style={estilos.rayo}>⚡</Text>
        </LinearGradient>}

        <View style={estilos.seccionHeader}>
          <Text style={estilos.seccionTitulo}>Accesos rapidos</Text>
        </View>

        <View style={estilos.gridAccesos}>
          <TouchableOpacity
            style={estilos.accesoCard}
            onPress={() => navigation.navigate('MisViajes', { usuario })}
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
          >
            <View style={estilos.accesoIconoBox}>
              <Text style={estilos.accesoIcono}>👤</Text>
            </View>
            <Text style={estilos.accesoTitulo}>Perfil</Text>
            <Text style={estilos.accesoSubtitulo}>Mi cuenta</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={estilos.cerrarSesion}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' },
  contenido: { padding: 24, paddingBottom: 40 },
  header: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usuarioBox: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTexto: { color: 'white', fontSize: 18, fontWeight: '900' },
  saludoChico: { color: '#9CA3AF', fontSize: 12 },
  nombreUsuario: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
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
  campana: { fontSize: 18 },
  puntoVerde: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    position: 'absolute',
    top: 9,
    right: 9,
  },
  notificacionesBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  notificacionesTitulo: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  notificacionesTexto: { color: '#B8C1CC', fontSize: 12, marginTop: 4 },
  hero: { marginTop: 34 },
  titulo: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  subtitulo: { color: '#B8C1CC', fontSize: 15, marginTop: 6 },
  cardBusqueda: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
  },
  lineaMapa: { width: 22, alignItems: 'center', paddingTop: 14, paddingBottom: 10, marginRight: 12 },
  puntoOrigen: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
  lineaVertical: { width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.20)', marginVertical: 6 },
  puntoDestino: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#22C55E' },
  inputsBox: { flex: 1 },
  inputGrupo: { paddingVertical: 6 },
  labelInput: { color: '#9CA3AF', fontSize: 10, marginBottom: 5 },
  input: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', padding: 0, outlineStyle: 'none' },
  separador: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 5 },
  sugerenciasBox: {
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#142746',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  sugerenciaItem: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sugerenciaIcono: { fontSize: 15, marginRight: 10 },
  sugerenciaTexto: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
  botonPrincipal: { marginTop: 16, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  textoBotonPrincipal: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  mensaje: { color: '#22C55E', textAlign: 'center', marginTop: 12, fontWeight: 'bold' },
  promoCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoPromo: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconoPromoTexto: { fontSize: 18 },
  promoTextoBox: { flex: 1 },
  promoTitulo: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  promoSubtitulo: { color: '#B8C1CC', fontSize: 11, marginTop: 2 },
  rayo: { fontSize: 18 },
  seccionHeader: { marginTop: 26, marginBottom: 12 },
  seccionTitulo: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  gridAccesos: { flexDirection: 'row', gap: 12 },
  accesoCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 16,
  },
  accesoIconoBox: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(37,99,235,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  accesoIcono: { fontSize: 20 },
  accesoTitulo: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  accesoSubtitulo: { color: '#B8C1CC', fontSize: 11, marginTop: 3 },
  cerrarSesion: { color: '#B8C1CC', textAlign: 'center', marginTop: 24 },
});
