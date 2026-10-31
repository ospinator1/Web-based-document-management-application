import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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
  onLoad: 'login-required' as const,
  pkceMethod: 'S256' as const,
  checkLoginIframe: false,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const initialized = useRef(false);
  const isLoggingIn = useRef(false);

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
      
      if (!res.ok) {
        if (res.status === 401) {
          const refreshed = await keycloak.updateToken(30);
          if (refreshed) {
            return loadProfile();
          }
        }
        throw new Error(`Profile fetch failed: ${res.status}`);
      }
      
      const data = await res.json();
      const realmRoles: string[] = data?.keycloak?.realm_roles ?? [];
      setUser({ ...data, realmRoles });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setUser(null);
      if (keycloak.authenticated) {
        await keycloak.logout({ redirectUri: window.location.origin + '/login' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;

    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init(KEYCLOAK_INIT_OPTIONS);
        if (cancelled) return;

        if (authenticated) {
          keycloak.onTokenExpired = () => {
            keycloak.updateToken(30).catch(() => {
              console.error('Token refresh failed');
              keycloak.login();
            });
          };
          await loadProfile();
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Keycloak init failed:', err);
        setUser(null);
        setLoading(false);
      }
    };

    initKeycloak();

    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(async (): Promise<void> => {
    if (isLoggingIn.current) return;
    isLoggingIn.current = true;
    
    try {
      await keycloak.login({ 
        redirectUri: window.location.origin + '/dashboard',
      });
    } catch (error) {
      console.error('Login failed:', error);
      isLoggingIn.current = false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    try {
      await keycloak.logout({ 
        redirectUri: window.location.origin + '/login' 
      });
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    await loadProfile();
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        refreshUser, 
        keycloak 
      }}
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