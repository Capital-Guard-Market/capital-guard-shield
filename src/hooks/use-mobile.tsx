import React, { createContext, useContext, useState } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SessionContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  login: (email?: string) => void;
  logout: () => void;
}

const defaultSession: SessionContextType = {
  user: { id: "trader_1", email: "trader@capitalguard.io", name: "Pro Trader" },
  session: { access_token: "mock_token" },
  loading: false,
  login: () => {},
  logout: () => {},
};

const SessionContext = createContext<SessionContextType>(defaultSession);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "trader_1",
    email: "trader@capitalguard.io",
    name: "Pro Trader",
  });
  const [session, setSession] = useState<any | null>({ access_token: "mock_token" });
  const [loading] = useState(false);

  const login = (email = "trader@capitalguard.io") => {
    setUser({ id: "trader_1", email, name: email.split("@")[0] });
    setSession({ access_token: "mock_token" });
  };

  const logout = () => {
    setUser(null);
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  // Safe fallback ensures the app never throws an uncaught crash
  if (!context) {
    return defaultSession;
  }
  return context;
}