// Importamos React.
import React from 'react';

// Importamos el contenedor de navegación.
import { NavigationContainer } from '@react-navigation/native';

// Importamos navegación de tipo stack.
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos las pantallas.
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';

// Creamos el navegador.
const Stack = createNativeStackNavigator();

// App es el componente principal.
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}