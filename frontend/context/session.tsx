import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { ApiUser, TOKEN_STORAGE_KEY } from '@/services/api';

export type User = { idUsuario: number; name: string; email: string; phone?: string };
type SessionContextValue = {
  user: User | null;
  loading: boolean;
  saveSession: (token: string, user: ApiUser) => Promise<void>;
  clearUser: () => Promise<void>;
};

const USER_STORAGE_KEY = '@viajaya/user';
const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function mapUser(user: ApiUser): User {
  return {
    idUsuario: user.idUsuario,
    name: user.nombre,
    email: user.email,
    phone: user.telefono ? String(user.telefono) : undefined,
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_STORAGE_KEY)
      .then(value => { if (value) setUser(JSON.parse(value)); })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = async (token: string, apiUser: ApiUser) => {
    const nextUser = mapUser(apiUser);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const clearUser = async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return <SessionContext.Provider value={{ user, loading, saveSession, clearUser }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
