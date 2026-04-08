import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { Session } from "../types";

interface AuthContextValue {
  session: Session | null;
  login: (input: { email: string; password: string }) => Promise<Session>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "hotelcompleto_session";

function getStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());

  const persist = (nextSession: Session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return nextSession;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(input) {
        const { data } = await api.post<Session>("/auth/login", input);
        return persist(data);
      },
      async register(input) {
        const { data } = await api.post<Session>("/auth/register", input);
        return persist(data);
      },
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
