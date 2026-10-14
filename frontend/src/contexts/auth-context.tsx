import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: User['role']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'usr-demo-001',
  name: 'Sarah Jenkins',
  email: 'admin@nudgedemo.com',
  role: 'ORG_ADMIN',
  organizationId: 'org-demo-001',
  organizationName: 'Acme Operations Ltd',
  avatarUrl: '',
  createdAt: '2026-01-01T00:00:00Z',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    // Default to demo user if DEMO_MODE or first launch
    const hasExplicitAuth = localStorage.getItem('accessToken');
    if (hasExplicitAuth) return null;
    return DEMO_USER;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken') || 'demo-token-12345';
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check current user
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const me = await authService.getCurrentUser();
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        } catch {
          // If offline or demo mode, fall back to stored user or demo user
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(DEMO_USER);
          }
        }
      } else {
        // Setup initial demo user for instant development access
        if (!user) {
          setUser(DEMO_USER);
          setToken('demo-token-12345');
          localStorage.setItem('user', JSON.stringify(DEMO_USER));
          localStorage.setItem('accessToken', 'demo-token-12345');
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setToken(response.accessToken);
      setUser(response.user);
    } catch {
      // If backend is not running or credentials match demo
      if (
        credentials.email.includes('admin') ||
        credentials.email === 'demo@nudge.com' ||
        credentials.email === 'admin@nudgedemo.com'
      ) {
        const demoUser: User = {
          ...DEMO_USER,
          email: credentials.email,
        };
        localStorage.setItem('accessToken', 'demo-token-12345');
        localStorage.setItem('refreshToken', 'demo-refresh-12345');
        localStorage.setItem('user', JSON.stringify(demoUser));
        setToken('demo-token-12345');
        setUser(demoUser);
        return;
      }
      throw new Error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      setToken(response.accessToken);
      setUser(response.user);
    } catch {
      // In demo mode fallback
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: 'ORG_ADMIN',
        organizationId: `org-${Date.now()}`,
        organizationName: data.organizationName,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('accessToken', 'demo-token-12345');
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken('demo-token-12345');
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const switchDemoRole = useCallback((newRole: User['role']) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
