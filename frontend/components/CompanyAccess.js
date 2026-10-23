import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function CompanyAccess() {
  const { empresa, modoViajaYa, cambiarModoViajaYa } = useApp();
  return <View style={{ gap: 12, marginTop: 12 }}>
    <Text style={{ color: '#CBD5E1' }}>
      {empresa
        ? `Empresa: ${empresa.nombre}`
        : 'Este correo todavía no está habilitado para ViajaYa Business. Si debería tener acceso, contactá al administrador de tu empresa.'}
    </Text>
    {empresa && <TouchableOpacity onPress={() => cambiarModoViajaYa(modoViajaYa === 'business' ? 'personal' : 'business')}>
      <Text style={{ color: '#7DD3FC', paddingVertical: 10 }}>
        {modoViajaYa === 'business' ? 'Usar ViajaYa Personal' : 'Usar ViajaYa Business'}
      </Text>
    </TouchableOpacity>}
  </View>;
}
