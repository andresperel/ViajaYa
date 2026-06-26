import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '@/context/session';
export default function Layout() { return <SessionProvider><StatusBar style="light"/><Stack screenOptions={{ headerShown: false, animation: 'fade' }}/></SessionProvider>; }
