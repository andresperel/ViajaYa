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
import HomeScreen from './screens/HomeScreen';
import ResultadosScreen from './screens/ResultadosScreen';
import ViajeConfirmadoScreen from './screens/ViajeConfirmadoScreen';

// Creo el Stack Navigator para manejar las pantallas.
const Stack = createNativeStackNavigator();

// Este es el componente principal de la app.
export default function App() {
  return (

    // NavigationContainer envuelve toda la navegación de la app.
    <NavigationContainer>

      {/* Stack.Navigator contiene todas las pantallas disponibles. */}
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* Pantalla inicial de bienvenida. */}
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
        />

        {/* Pantalla para iniciar sesión. */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        {/* Pantalla para registrarse. */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        {/* Pantalla principal después del login. */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        {/* Pantalla donde se muestran las opciones de viaje. */}
        <Stack.Screen
          name="Resultados"
          component={ResultadosScreen}
        />

        {/* Pantalla que confirma el viaje elegido. */}
        <Stack.Screen
          name="ViajeConfirmado"
          component={ViajeConfirmadoScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}