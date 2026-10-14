import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../services/api';
import { useApp } from '../context/AppContext';

export default function CompanyAccess() {
  const { empresa, setEmpresa, modoViajaYa, cambiarModoViajaYa } = useApp();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  async function acceder() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError('');
    try {
      const data = await apiFetch('/business/acceder', { method: 'POST', body: JSON.stringify({ codigo }) });
      if (!mounted.current) return;
      setEmpresa(data.empresa); cambiarModoViajaYa('business'); setCodigo('');
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <View style={{ gap: 12, marginTop: 12 }}>
    <Text style={{ color: '#CBD5E1' }}>{empresa ? `Empresa: ${empresa.nombre}` : 'Ingresá el código que te brindó tu empresa. Tu correo debe estar autorizado.'}</Text>
    {empresa && <TouchableOpacity onPress={() => cambiarModoViajaYa(modoViajaYa === 'business' ? 'personal' : 'business')}><Text style={{ color: '#7DD3FC', paddingVertical: 10 }}>{modoViajaYa === 'business' ? 'Usar ViajaYa Personal' : 'Usar ViajaYa Business'}</Text></TouchableOpacity>}
    {!empresa && <>
      <TextInput accessibilityLabel="Código de empresa" placeholder="Código de empresa" placeholderTextColor="#94A3B8" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" autoCorrect={false} maxLength={16} editable={!busy} style={{ color: '#FFF', borderColor: '#64748B', borderWidth: 1, borderRadius: 12, padding: 14 }} />
      <TouchableOpacity disabled={busy || !codigo.trim()} onPress={acceder} style={{ padding: 14, backgroundColor: '#2563EB', borderRadius: 12, opacity: busy || !codigo.trim() ? 0.5 : 1 }}><Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '700' }}>{busy ? 'Verificando…' : 'Acceder a mi empresa'}</Text></TouchableOpacity>
    </>}
    {!!error && <Text accessibilityRole="alert" style={{ color: '#FCA5A5' }}>{error}</Text>}
  </View>;
}
