import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

export type User = { name: string; email: string; phone?: string };
type SessionContextValue = { user: User | null; loading: boolean; saveUser: (user: User) => Promise<void>; clearUser: () => Promise<void> };
const KEY = '@viajaya/user';
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { AsyncStorage.getItem(KEY).then(value => { if (value) setUser(JSON.parse(value)); }).finally(() => setLoading(false)); }, []);
  const saveUser = async (nextUser: User) => { await AsyncStorage.setItem(KEY, JSON.stringify(nextUser)); setUser(nextUser); };
  const clearUser = async () => { await AsyncStorage.removeItem(KEY); setUser(null); };
  return <SessionContext.Provider value={{ user, loading, saveUser, clearUser }}>{children}</SessionContext.Provider>;
}
export function useSession() { const session = useContext(SessionContext); if (!session) throw new Error('useSession must be used inside SessionProvider'); return session; }
