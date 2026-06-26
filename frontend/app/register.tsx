import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { C, Field, GradientButton, IconButton, ScreenTitle } from '@/components/ui';
import { useSession } from '@/context/session';

export default function Register() {
  const router = useRouter(); const { saveUser } = useSession();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const submit = async () => { if (!name.trim() || !email.trim() || !phone.trim() || !password) return Alert.alert('Completá tus datos', 'Nombre, email, teléfono y contraseña son obligatorios.'); if (password !== confirm) return Alert.alert('Las contraseñas no coinciden'); await saveUser({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() }); router.push('/verify'); };
  return <ScrollView style={s.page} contentContainerStyle={s.content}><IconButton name="arrow-back" onPress={() => router.back()}/><View style={s.head}><ScreenTitle eyebrow="Tu cuenta ViajaYa" title="Empezá a moverte mejor" detail="Tus datos están protegidos y nunca compartimos tu información personal."/></View><View style={s.fields}><Field icon="person-outline" placeholder="Nombre completo" value={name} onChangeText={setName}/><Field icon="mail-outline" placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><Field icon="call-outline" placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/><Field icon="lock-closed-outline" placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry/><Field icon="shield-checkmark-outline" placeholder="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry/></View><GradientButton label="Crear cuenta" onPress={submit}/></ScrollView>;
}
const s = StyleSheet.create({ page:{flex:1,backgroundColor:C.bg},content:{padding:24,paddingTop:60},head:{marginTop:34},fields:{gap:12,marginTop:35,marginBottom:20} });
