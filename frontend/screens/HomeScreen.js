import React from 'react';
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#071B3B', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 28 }}>Home</Text>
    </View>
  );
}