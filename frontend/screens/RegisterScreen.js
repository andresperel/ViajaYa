import React from 'react';
import { Controller } from 'react-hook-form';
import useRegistration, { registrationRules } from '../hooks/useRegistration';
import { LinearGradient } from 'expo-linear-gradient';

import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function RegisterScreen({ navigation }) {
  const {
    control, enviar, mostrarPoliticas, setMostrarPoliticas,
    formState: { errors, isSubmitting },
  } = useRegistration(navigation);

  return (
    <SafeAreaView style={estilos.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => navigation.navigate('Welcome')}
        >
          <Text style={estilos.botonVolverTexto}>←</Text>
        </TouchableOpacity>

        <View style={estilos.headerRegistro}>
          <Text style={estilos.titulo}>Crear cuenta</Text>
          <Text style={estilos.subtitulo}>Toma menos de un minuto. Sin tarjeta.</Text>
        </View>

        <View style={estilos.formulario}>
          <Campo control={control} name="nombre" error={errors.nombre?.message}
            editable={!isSubmitting} icono="👤" label="Nombre completo" placeholder="Maria Gonzalez" autoCapitalize="words" />
          <Campo control={control} name="email" error={errors.email?.message}
            editable={!isSubmitting} icono="✉️" label="Correo electrónico" placeholder="maria@ejemplo.com"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Campo control={control} name="telefono" error={errors.telefono?.message}
            editable={!isSubmitting} icono="📱" label="Teléfono" placeholder="+54 11 0000 0000" keyboardType="phone-pad" />
          <Campo control={control} name="password" error={errors.password?.message}
            editable={!isSubmitting} icono="🔒" label="Contraseña" placeholder="Mínimo 8 caracteres"
            secureTextEntry autoCapitalize="none" autoCorrect={false} />

          <Controller control={control} name="terminos" rules={registrationRules.terminos}
            render={({ field: { value, onChange, onBlur } }) => (
          <TouchableOpacity
            style={estilos.terminosBox}
            activeOpacity={0.85}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityLabel="Acepto los términos y condiciones y la política de privacidad"
            accessibilityState={{ checked: value, disabled: isSubmitting }}
            onPress={() => { onChange(!value); onBlur(); }}
          >
            {value ? (
              <LinearGradient
                colors={['#2563EB', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={estilos.checkBox}
              >
                <Text style={estilos.checkTexto}>✓</Text>
              </LinearGradient>
            ) : (
              <View style={[estilos.checkBox, estilos.checkBoxVacio]} />
            )}

            <Text style={estilos.terminosTexto}>
              Acepto los <Text style={estilos.terminosBlanco}>terminos y condiciones</Text> y la{' '}
              <Text style={estilos.terminosBlanco}>politica de privacidad</Text>.
            </Text>
          </TouchableOpacity>

            )} />
          {errors.terminos && <Text accessibilityRole="alert" style={estilos.errorTexto}>{errors.terminos.message}</Text>}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setMostrarPoliticas((valorActual) => !valorActual)}
          >
            <Text style={estilos.leerMas}>
              {mostrarPoliticas ? 'Ocultar' : 'Leer mas'}
            </Text>
          </TouchableOpacity>

          {mostrarPoliticas && (
            <View style={estilos.politicasBox}>
              <Text style={estilos.politicasTexto}>
                ViajaYa usa tus datos para crear tu cuenta, iniciar sesion, guardar tus viajes y
                mostrarte opciones de movilidad. No compartimos tu contrasena y podes pedir cambios
                o eliminacion de tus datos desde soporte.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={enviar} disabled={isSubmitting} accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }} activeOpacity={0.85}>
            <LinearGradient
              colors={['#2563EB', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={estilos.botonPrincipal}
            >
              <Text style={estilos.textoBotonPrincipal}>{isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {errors.root?.server && <Text accessibilityRole="alert" style={[estilos.mensaje, estilos.errorTexto]}>{errors.root.server.message}</Text>}
        </View>

        <TouchableOpacity
          style={estilos.loginBox}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={estilos.loginTexto}>
            ¿Ya tenes cuenta? <Text style={estilos.loginLink}>Iniciar sesion</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({
  control,
  name,
  icono,
  label,
  error,
  ...props
}) {
  return (
    <View style={estilos.campoBox}>
      <Text style={estilos.label}>{label}</Text>

      <View style={[estilos.inputBox, !!error && estilos.inputBoxError]}>
        <Text style={estilos.inputIcono}>{icono}</Text>
        <Controller control={control} name={name} rules={registrationRules[name]}
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextInput {...props} ref={ref} value={value} onChangeText={onChange} onBlur={onBlur}
              accessibilityLabel={label} style={estilos.input} placeholderTextColor="#7F8EA3" />
          )} />
      </View>

      {!!error && (
        <Text accessibilityRole="alert" style={estilos.errorTexto}>{error}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1F3A',
  },

  contenido: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },

  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  botonVolverTexto: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  headerRegistro: {
    marginTop: 30,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    marginTop: 10,
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },

  formulario: {
    marginTop: 26,
  },

  campoBox: {
    marginBottom: 12,
  },

  label: {
    color: '#B8C1CC',
    fontSize: 11,
    marginLeft: 4,
    marginBottom: 7,
    fontWeight: '600',
  },

  inputBox: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputBoxError: {
    borderColor: '#EF4444',
  },

  inputIcono: {
    fontSize: 16,
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    outlineStyle: 'none',
  },

  errorTexto: {
    color: '#EF4444',
    fontSize: 11,
    marginLeft: 4,
    marginTop: 6,
    fontWeight: '600',
  },

  terminosBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },

  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  checkBoxVacio: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  checkTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  terminosTexto: {
    color: '#B8C1CC',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  terminosBlanco: {
    color: '#FFFFFF',
  },

  leerMas: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 32,
    marginTop: 4,
  },

  politicasBox: {
    marginLeft: 32,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  politicasTexto: {
    color: '#B8C1CC',
    fontSize: 11,
    lineHeight: 17,
  },

  botonPrincipal: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  mensaje: {
    color: '#22C55E',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 14,
  },

  loginBox: {
    marginTop: 'auto',
    paddingTop: 22,
  },

  loginTexto: {
    color: '#B8C1CC',
    textAlign: 'center',
    fontSize: 14,
  },

  loginLink: {
    color: '#22C55E',
    fontWeight: 'bold',
  },
});
