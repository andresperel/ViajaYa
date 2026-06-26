import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { C, Field, GradientButton, GhostButton, ScreenTitle } from '@/components/ui';
import { useSession } from '@/context/session';
import { login } from '@/services/api';

export default function Login() {
  const router = useRouter();
  const { user, saveSession } = useSession();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) return setMessage('Completá email y contraseña.');

    setMessage('Ingresando...');
    setSubmitting(true);
    try {
      const session = await login(email.trim().toLowerCase(), password);
      await saveSession(session.token, session.usuario);
      router.replace('/home');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Revisá tus datos e intentá nuevamente.';
      setMessage(detail);
      Alert.alert('No pudimos iniciar sesión', detail);
    } finally {
      setSubmitting(false);
    }
  };

  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <View style={s.logo}><Text style={s.logoMark}>↗</Text><Text style={s.logoText}>viaja<Text style={{ color: C.cyan }}>ya</Text></Text></View>
    <ScreenTitle eyebrow="Bienvenido de nuevo" title="Entrá a tu cuenta" detail="Compará tu próxima forma de moverte." />
    <View style={s.form}>
      <Field icon="mail-outline" placeholder="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <View style={{ height: 12 }} />
      <Field icon="lock-closed-outline" placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <GhostButton label="¿Olvidaste tu contraseña?" />
      <GradientButton label={submitting ? 'Ingresando...' : 'Iniciar sesión'} onPress={submit} />
      {!!message && <Text style={s.message}>{message}</Text>}
      <View style={s.or}><View style={s.line} /><Text style={s.orText}>O CONTINUÁ CON</Text><View style={s.line} /></View>
      <View style={s.socials}><Social label="G" /><Social label="" /></View>
    </View>
    <View style={s.footer}><Text style={s.footerText}>¿Todavía no tenés una cuenta?</Text><Pressable onPress={() => router.push('/register')}><Text style={s.link}> Crear cuenta</Text></Pressable></View>
  </ScrollView>;
}

function Social({ label }: { label: string }) {
  return <Pressable style={s.social}><Text style={s.socialText}>{label}</Text></Pressable>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingTop: 64, paddingBottom: 32 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 64 },
  logoMark: { color: C.cyan, fontSize: 28, fontWeight: '700' },
  logoText: { color: C.text, fontSize: 22, fontWeight: '700', letterSpacing: -1 },
  form: { marginTop: 35 },
  message: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 12 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 26, marginBottom: 17 },
  line: { height: 1, flex: 1, backgroundColor: C.border },
  orText: { fontSize: 10, color: C.faint, fontWeight: '700', letterSpacing: 0.7 },
  socials: { flexDirection: 'row', gap: 12 },
  social: { height: 52, flex: 1, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.035)' },
  socialText: { color: C.text, fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 45 },
  footerText: { color: C.muted, fontSize: 13 },
  link: { color: C.cyan, fontWeight: '700', fontSize: 13 },
});
