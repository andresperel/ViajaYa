// Importo React para poder crear componentes.
import React, { useEffect, useRef } from 'react';

// Importo el contenedor principal de navegación.
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';

// Importo el tipo de navegación Stack, que me permite pasar de una pantalla a otra.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importo todas las pantallas de mi aplicación.
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import ResultadosScreen from './screens/ResultadosScreen';
import ViajeConfirmadoScreen from './screens/ViajeConfirmadoScreen';
import MisViajesScreen from './screens/MisViajesScreen';
import PerfilScreen from './screens/PerfilScreen';
import NotificacionesScreen from './screens/NotificacionesScreen';
import IdiomaScreen from './screens/IdiomaScreen';
import AyudaScreen from './screens/AyudaScreen';
import PrivacidadScreen from './screens/PrivacidadScreen';
import { AppProvider } from './context/AppContext';
import { supabase } from './services/supabase';
import { apiFetch, setAuthToken } from './services/api';

// Creo el Stack Navigator para manejar las pantallas.
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

// Este es el componente principal de la app.
export default function App() {
  const oauthCallbackResult = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !supabase) return undefined;
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const returnedFromOAuth = query.has('code') || query.has('error')
      || hash.has('access_token') || hash.has('error');
    if (!returnedFromOAuth) return undefined;

    let cancelled = false;
    const navigate = (screen, params) => {
      const action = () => navigationRef.reset({ index: 0, routes: [{ name: screen, params }] });
      if (navigationRef.isReady()) action();
      else oauthCallbackResult.current = action;
    };

    const finishOAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session?.access_token) throw new Error('Google no devolvió una sesión válida. Revisa la URL de retorno permitida en Supabase.');
        const login = await apiFetch('/social-login', {
          method: 'POST',
          body: JSON.stringify({ provider: 'google', supabaseAccessToken: data.session.access_token }),
        });
        if (cancelled) return;
        setAuthToken(login.token);
        navigate('Home', { usuario: login.usuario });
      } catch (error) {
        if (!cancelled) navigate('Login', { googleError: error.message || 'No se pudo completar el inicio con Google.' });
      }
    };

    finishOAuth();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppProvider>
    <NavigationContainer ref={navigationRef} onReady={() => {
      if (oauthCallbackResult.current) {
        oauthCallbackResult.current();
        oauthCallbackResult.current = null;
      }
    }}>

      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* Pantalla de bienvenida */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />

        {/* Pantalla de login */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        {/* Pantalla de registro */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
        />

        {/* Pantalla principal */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        {/* Resultados de búsqueda */}
        <Stack.Screen
          name="Resultados"
          component={ResultadosScreen}
        />

        {/* Confirmación de viaje */}
        <Stack.Screen
          name="ViajeConfirmado"
          component={ViajeConfirmadoScreen}
        />

        {/* Historial de viajes */}
        <Stack.Screen
          name="MisViajes"
          component={MisViajesScreen}
        />

        {/* Perfil del usuario */}
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
        />

        <Stack.Screen
          name="Notificaciones"
          component={NotificacionesScreen}
        />

        <Stack.Screen name="Idioma" component={IdiomaScreen} />
        <Stack.Screen name="Ayuda" component={AyudaScreen} />
        <Stack.Screen name="Privacidad" component={PrivacidadScreen} />

      </Stack.Navigator>

    </NavigationContainer>
    </AppProvider>
  );
}
