import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import keycloak from '../keycloak';

export interface AuthUser {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
  realmRoles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  keycloak: typeof keycloak;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const KEYCLOAK_INIT_OPTIONS = {
  onLoad: 'check-sso' as const,
  silentCheckSsoRedirectUri:
    window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (): Promise<void> => {
    if (!keycloak.authenticated || !keycloak.token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/auth/keycloak/profile/`, {
        headers: { Authorization: `Bearer ${keycloak.token}` },
      });
      if (!res.ok) throw new Error('profile fetch failed');
      const data = await res.json();
      const realmRoles: string[] = data?.keycloak?.realm_roles ?? [];
      setUser({ ...data, realmRoles });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    keycloak
      .init(KEYCLOAK_INIT_OPTIONS)
      .then(async (authenticated) => {
        if (cancelled) return;

        if (authenticated) {
          keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).catch(() => keycloak.login());
          };
          await loadProfile();
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = async (): Promise<void> => {
    await keycloak.login({ redirectUri: window.location.origin + '/dashboard' });
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    await keycloak.logout({ redirectUri: window.location.origin + '/login' });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser: loadProfile, keycloak }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};