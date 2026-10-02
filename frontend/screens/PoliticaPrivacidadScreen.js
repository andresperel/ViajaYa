import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SECCIONES = [
  {
    titulo: '1. Quién trata tus datos',
    texto: 'ViajaYa trata los datos necesarios para operar la aplicación. Para consultas sobre privacidad o para ejercer tus derechos, escribinos a contacto@viajaya.app desde el correo de tu cuenta e indicá qué solicitud querés realizar.',
  },
  {
    titulo: '2. Qué datos usamos',
    texto: 'Según cómo uses el servicio, podemos tratar tu nombre, correo electrónico y teléfono; datos de autenticación; las direcciones de origen y destino que ingresás y sus coordenadas asociadas; y los datos de las búsquedas y viajes que decidís guardar, como proveedor elegido, estimación de precio, duración y estado. En el registro con contraseña, la contraseña se almacena como un hash y no se devuelve en las respuestas de la cuenta. Si ingresás con Google, recibimos datos básicos de la cuenta necesarios para identificarte, como correo y nombre disponible.',
  },
  {
    titulo: '3. Para qué los usamos',
    texto: 'Usamos esos datos para crear y administrar tu cuenta, autenticarte, responder tus búsquedas de direcciones, calcular rutas y mostrar estimaciones, guardar y mostrar tu historial, proteger el servicio y atender solicitudes relacionadas con la cuenta.',
  },
  {
    titulo: '4. Direcciones y ubicación',
    texto: 'ViajaYa usa las direcciones que escribís o seleccionás y las coordenadas calculadas a partir de ellas para resolver la búsqueda y la ruta. La versión actual no solicita acceso al GPS ni registra tu ubicación en segundo plano. Para completar sugerencias de direcciones y rutas, la consulta puede enviarse al servicio externo de mapas o geocodificación configurado para la aplicación.',
  },
  {
    titulo: '5. Servicios y comunicaciones con terceros',
    texto: 'La base de cuentas y viajes se administra mediante Supabase. El inicio con Google utiliza Google y Supabase. La búsqueda de direcciones y el cálculo de rutas pueden usar servicios como Google Maps Platform, OpenRouteService, OpenStreetMap/Nominatim o GeoRef, según la configuración disponible. Si elegís continuar en una plataforma de movilidad, ViajaYa puede abrirla con datos de la ruta o facilitarte copiar una dirección; desde ese momento también se aplican las condiciones y políticas de ese proveedor. Estos servicios tienen sus propias prácticas y pueden procesar datos desde otros países.',
  },
  {
    titulo: '6. Conservación y seguridad',
    texto: 'Los datos de la cuenta y los viajes guardados se conservan mientras sean necesarios para brindar las funciones de ViajaYa y gestionar el historial. También podrían conservarse por el tiempo que exijan obligaciones legales o para resolver reclamos. Aplicamos medidas técnicas y organizativas para proteger la información; ningún sistema conectado a Internet puede garantizar seguridad absoluta.',
  },
  {
    titulo: '7. Tus derechos',
    texto: 'Podés solicitar acceso a tus datos y pedir su actualización, rectificación o supresión, de acuerdo con la Ley 25.326 y las normas aplicables. Escribinos a contacto@viajaya.app desde el correo asociado a tu cuenta para que podamos identificarla y responder. También podés consultar información sobre tus derechos ante la Agencia de Acceso a la Información Pública (AAIP).',
  },
  {
    titulo: '8. Cambios a esta política',
    texto: 'Si cambian los datos tratados o la forma de usarlos, actualizaremos esta política e indicaremos la nueva fecha. Si el cambio requiere una decisión o consentimiento adicional, te lo vamos a solicitar.',
  },
];

export default function PoliticaPrivacidadScreen({ navigation }) {
  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.volver} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Volver">
            <Text style={estilos.flecha}>‹</Text>
          </TouchableOpacity>
          <View style={estilos.headerTexto}>
            <Text style={estilos.titulo}>Política de Privacidad</Text>
            <Text style={estilos.subtitulo}>Última actualización: 2 de octubre de 2026</Text>
          </View>
        </View>

        <Text style={estilos.introduccion}>
          Esta política explica qué información usa ViajaYa, para qué la necesita y cómo podés ejercer tus derechos.
        </Text>

        {SECCIONES.map((seccion) => (
          <View key={seccion.titulo} style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>{seccion.titulo}</Text>
            <Text style={estilos.texto}>{seccion.texto}</Text>
          </View>
        ))}

        <TouchableOpacity style={estilos.enlace} onPress={() => navigation.navigate('Terminos')} accessibilityRole="link">
          <Text style={estilos.enlaceTexto}>Leer los Términos y Condiciones ›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F3A' },
  contenido: { padding: 24, paddingBottom: 44 },
  header: { marginTop: 8, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTexto: { flex: 1 },
  volver: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  flecha: { color: '#FFF', fontSize: 30, lineHeight: 34 },
  titulo: { color: '#FFF', fontSize: 23, fontWeight: '900' },
  subtitulo: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  introduccion: { color: '#D7DEE8', fontSize: 13, lineHeight: 21, marginBottom: 16 },
  seccion: { borderRadius: 16, padding: 15, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  seccionTitulo: { color: '#FFF', fontSize: 14, lineHeight: 20, fontWeight: '800', marginBottom: 7 },
  texto: { color: '#B8C1CC', fontSize: 12, lineHeight: 19 },
  enlace: { marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.10)' },
  enlaceTexto: { color: '#22C55E', fontSize: 13, fontWeight: '800' },
});
