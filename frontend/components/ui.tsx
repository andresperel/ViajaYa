import React, { PropsWithChildren, useEffect } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export const C = { bg: '#041A2B', panel: '#06263A', card: '#0A3148', cyan: '#22D3EE', blue: '#0EA5E9', teal: '#14B8A6', green: '#34D399', violet: '#2563EB', text: '#F8FCFF', muted: '#A8C5D8', faint: '#6E91A8', border: 'rgba(103,232,249,.16)' };

export function GlassCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) { return <View style={[s.card, style]}>{children}</View>; }

export function GradientButton({ label, onPress, disabled, compact = false }: { label: string; onPress?: () => void; disabled?: boolean; compact?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.buttonWrap, compact && s.compact, (pressed || disabled) && { opacity: disabled ? .42 : .8, transform: [{ scale: .985 }] }]}>
    <LinearGradient colors={[C.green, C.teal, C.cyan, C.blue]} locations={[0, .33, .66, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.button}><Text style={s.buttonText}>{label}</Text></LinearGradient>
  </Pressable>;
}
export function GhostButton({ label, onPress }: { label: string; onPress?: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [s.ghost, pressed && { opacity: .7 }]}><Text style={s.ghostText}>{label}</Text></Pressable>; }

export function IconButton({ name, onPress, badge }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; badge?: boolean }) { return <Pressable onPress={onPress} style={s.iconButton}><Ionicons name={name} size={20} color={C.text}/>{badge && <View style={s.dot}/>}</Pressable>; }

export function Field({ icon, ...props }: TextInputProps & { icon: keyof typeof Ionicons.glyphMap }) { return <View style={s.field}><Ionicons name={icon} size={18} color={C.muted}/><TextInput {...props} placeholderTextColor={C.faint} style={s.input}/></View>; }

export function ScreenTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) { return <Animated.View entering={FadeInDown.duration(300)}>{eyebrow && <Text style={s.eyebrow}>{eyebrow}</Text>}<Text style={s.title}>{title}</Text>{detail && <Text style={s.detail}>{detail}</Text>}</Animated.View>; }

export function Pulse({ size = 8 }: { size?: number }) { const v = useSharedValue(1); useEffect(() => { v.value = withRepeat(withSequence(withTiming(1.7, { duration: 900 }), withTiming(1, { duration: 900 })), -1); }, []); const st = useAnimatedStyle(() => ({ transform: [{ scale: v.value }], opacity: 2 - v.value })); return <Animated.View style={[{ width: size, height: size, borderRadius: size, backgroundColor: C.cyan }, st]}/>; }

const s = StyleSheet.create({
  card: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, borderRadius: 20, shadowColor: '#001018', shadowOpacity: .38, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  buttonWrap: { shadowColor: C.teal, shadowOpacity: .5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, button: { height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236,253,245,.36)' }, compact: { alignSelf: 'flex-start' }, buttonText: { color: '#032031', fontSize: 15, fontWeight: '800', letterSpacing: .2 },
  ghost: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, ghostText: { color: C.cyan, fontWeight: '600', fontSize: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#093247', borderWidth: 1, borderColor: C.border, position: 'relative' }, dot: { width: 7, height: 7, borderRadius: 5, position: 'absolute', top: 9, right: 10, backgroundColor: C.green, borderWidth: 1, borderColor: C.bg },
  field: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, backgroundColor: '#082B40', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,211,238,.28)' }, input: { color: C.text, fontSize: 15, flex: 1, paddingVertical: 12 },
  eyebrow: { color: C.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }, title: { color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -.7 }, detail: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
});
