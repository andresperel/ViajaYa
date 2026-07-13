// Importo React para poder crear componentes.
import React from 'react';

// Importo el contenedor principal de navegación.
import { NavigationContainer } from '@react-navigation/native';

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

// Creo el Stack Navigator para manejar las pantallas.
const Stack = createNativeStackNavigator();

// Este es el componente principal de la app.
export default function App() {
  return (
    <NavigationContainer>

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

      </Stack.Navigator>

    </NavigationContainer>
  );
}
