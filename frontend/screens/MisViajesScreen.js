import React, { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyTrips } from '../services/api';

import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function MisViajesScreen({ navigation, route }) {
  const usuario = route?.params?.usuario;

  const [viajesGuardados, setViajesGuardados] = useState([]);
  const [mensajeEnPantalla, setMensajeEnPantalla] = useState('Cargando viajes...');

  useEffect(() => {
    obtenerMisViajes();
  }, []);

  const obtenerMisViajes = async () => {
    try {
      setMensajeEnPantalla('Cargando viajes...');

      const datosRecibidos = await getMyTrips();

      setViajesGuardados(datosRecibidos);

      if (datosRecibidos.length === 0) {
        setMensajeEnPantalla('Todavía no tenés viajes guardados');
      } else {
        setMensajeEnPantalla('');
      }

    } catch (error) {
      setMensajeEnPantalla('No pude conectarme con el servidor');
      console.log('Error al obtener viajes:', error);
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navigation.navigate('Home', { usuario })}>
            <Text style={estilos.flecha}>←</Text>
          </TouchableOpacity>

          <View>
            <Text style={estilos.titulo}>Tus viajes</Text>
            <Text style={estilos.subtitulo}>Historial y viajes en curso</Text>
          </View>
        </View>

        <View style={estilos.chipsBox}>
          <LinearGradient colors={['#2563EB', '#22C55E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.chipActivo}>
            <Text style={estilos.chipActivoTexto}>Todos</Text>
          </LinearGradient>

          <View style={estilos.chip}><Text style={estilos.chipTexto}>Este mes</Text></View>
          <View style={estilos.chip}><Text style={estilos.chipTexto}>Anteriores</Text></View>
        </View>

        {mensajeEnPantalla !== '' && <Text style={estilos.mensaje}>{mensajeEnPantalla}</Text>}

        <View style={estilos.listaViajes}>
          {viajesGuardados.map((viaje, index) => (
            <ViajeCard key={viaje.idViaje || index} viaje={viaje} index={index} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}