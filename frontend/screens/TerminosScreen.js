import React from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SECCIONES = [
  {
    titulo: '1. Qué es ViajaYa',
    texto: 'ViajaYa es una aplicación que permite ingresar un origen y un destino, consultar una ruta estimada y comparar opciones orientativas de movilidad. ViajaYa no presta servicios de transporte, no es dueña de vehículos y no representa a Uber, DiDi, Cabify ni a otros proveedores.',
  },
  {
    titulo: '2. Cómo se calculan las opciones',
    texto: 'La distancia y la duración de la ruta se calculan con servicios de mapas y rutas. Los precios, tiempos de llegada y categorías que hoy muestra la aplicación son estimaciones internas para comparar opciones: no son cotizaciones oficiales ni necesariamente se consultan en tiempo real a Uber, DiDi o Cabify. Pueden ser inexactas, estar desactualizadas o no corresponder a una oferta disponible. Verificá siempre el precio, la disponibilidad, el vehículo y el tiempo en la aplicación del proveedor antes de pedir un viaje.',
  },
  {
    titulo: '3. Contratación del viaje',
    texto: 'Si elegís una opción, ViajaYa puede abrir la aplicación o el sitio del proveedor seleccionado y, según el proveedor y el dispositivo, facilitar la carga de una dirección o copiarla para que la ingreses. La solicitud, el precio definitivo, el pago y el traslado se acuerdan directamente entre vos y ese proveedor. Antes de confirmar, revisá sus condiciones y la información del viaje.',
  },
  {
    titulo: '4. Cuenta y uso responsable',
    texto: 'Para crear una cuenta debés ser mayor de 18 años y proporcionar datos correctos y actualizados. Sos responsable de cuidar tus credenciales y de la actividad realizada desde tu cuenta. No uses ViajaYa para fines ilegales o fraudulentos, interferir con el servicio, intentar acceder a cuentas o sistemas ajenos, extraer datos de forma automatizada ni descompilar o hacer ingeniería inversa, salvo que la ley lo permita.',
  },
  {
    titulo: '5. Servicios de terceros',
    texto: 'ViajaYa depende de servicios externos para autenticación, búsqueda de direcciones y cálculo de rutas, y puede derivarte a aplicaciones de movilidad. Esos servicios tienen sus propias condiciones, disponibilidad y políticas de privacidad. ViajaYa no controla sus sistemas ni garantiza que estén disponibles o que acepten una solicitud. Los nombres y marcas pertenecen a sus respectivos titulares; mencionarlos no implica afiliación ni patrocinio.',
  },
  {
    titulo: '6. Disponibilidad y responsabilidad',
    texto: 'La aplicación puede interrumpirse, contener errores o mostrar información incompleta, especialmente si fallan la conexión o los servicios externos. ViajaYa no responde por la conducción, el viaje, las cancelaciones, los cobros ni la atención brindada por un proveedor de movilidad. Esto no limita las responsabilidades ni los derechos que no puedan excluirse conforme a la legislación aplicable, incluidos los derechos de las personas consumidoras.',
  },
  {
    titulo: '7. Contenidos y propiedad intelectual',
    texto: 'La aplicación, su diseño y sus contenidos pertenecen a sus respectivos titulares y están protegidos por las normas aplicables. Estos términos no te transfieren derechos de propiedad sobre ellos. Podés usar ViajaYa para fines personales y conforme a estos términos y a la ley.',
  },
  {
    titulo: '8. Cambios y cierre de cuenta',
    texto: 'Podemos actualizar estos términos cuando cambie el servicio o por otros motivos. Publicaremos la versión vigente en la aplicación e indicaremos su fecha de actualización. Si un cambio requiere una nueva aceptación, te la solicitaremos. Podés dejar de usar ViajaYa y solicitar la baja o eliminación de tus datos escribiendo al contacto indicado en la Política de Privacidad, sujeto a las obligaciones legales de conservación que correspondan.',
  },
  {
    titulo: '9. Privacidad',
    texto: 'El uso de los datos personales se explica en la Política de Privacidad. Leela antes de crear una cuenta; desde esta pantalla podés abrirla al final.',
  },
  {
    titulo: '10. Ley aplicable y derechos',
    texto: 'Estos términos se interpretan de acuerdo con las leyes de la República Argentina, sin privarte de las protecciones obligatorias que te correspondan como consumidor según tu lugar de residencia. Cualquier controversia se resolverá ante las autoridades y tribunales competentes conforme a esas normas.',
  },
];

export default function TerminosScreen({ navigation }) {
  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.header}>
          <TouchableOpacity style={estilos.volver} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Volver">
            <Text style={estilos.flecha}>‹</Text>
          </TouchableOpacity>
          <View style={estilos.headerTexto}>
            <Text style={estilos.titulo}>Términos y condiciones</Text>
            <Text style={estilos.subtitulo}>Última actualización: 2 de octubre de 2026</Text>
          </View>
        </View>

        <Text style={estilos.introduccion}>
          Al crear una cuenta o usar ViajaYa, declarás que tenés 18 años o más y aceptás estos términos. Si no estás de acuerdo, no uses el servicio.
        </Text>

        {SECCIONES.map((seccion) => (
          <View key={seccion.titulo} style={estilos.seccion}>
            <Text style={estilos.seccionTitulo}>{seccion.titulo}</Text>
            <Text style={estilos.texto}>{seccion.texto}</Text>
          </View>
        ))}

        <TouchableOpacity style={estilos.enlace} onPress={() => navigation.navigate('PoliticaPrivacidad')} accessibilityRole="link">
          <Text style={estilos.enlaceTexto}>Leer la Política de Privacidad ›</Text>
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
