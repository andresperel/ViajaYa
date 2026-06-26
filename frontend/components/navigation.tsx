import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { C } from './ui';
const items = [{ label: 'Inicio', icon: 'home-outline', href: '/home' }, { label: 'Buscar', icon: 'search-outline', href: '/search' }, { label: 'Guardados', icon: 'heart-outline', href: '/favorites' }, { label: 'Alertas', icon: 'notifications-outline', href: '/notifications' }, { label: 'Perfil', icon: 'person-outline', href: '/profile' }] as const;
export function BottomNav() { const router = useRouter(); const path = usePathname(); return <View style={s.bar}>{items.map(x => { const active = path === x.href; return <Pressable key={x.href} onPress={() => router.push(x.href)} style={s.item}><View style={[s.active, active && s.activeOn]}/><Ionicons name={x.icon} size={21} color={active ? C.cyan : C.muted}/><Text style={[s.text, active && { color: C.text }]}>{x.label}</Text></Pressable>; })}</View>; }
const s = StyleSheet.create({ bar: { height: 76, flexDirection: 'row', backgroundColor: '#041A2B', borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 6 }, item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' }, active: { position: 'absolute', top: 0, height: 3, width: 26, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }, activeOn: { backgroundColor: C.green }, text: { color: C.muted, fontWeight: '500', fontSize: 10 } });
