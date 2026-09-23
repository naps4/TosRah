import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';

type Role = 'BUYER' | 'SELLER' | 'ADMIN';
type User = { id: string; email: string; name: string; role: Role };

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

type AuthResponse = { accessToken: string; user: User };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // saat pertama buka web, cek token tersimpan masih valid atau tidak
  useEffect(() => {
    const saved = localStorage.getItem('tosrah_token');
    if (!saved) {
      setLoading(false);
      return;
    }
    api<User>('/auth/me', { headers: { Authorization: `Bearer ${saved}` } })
      .then((me) => {
        setToken(saved);
        setUser(me);
      })
      .catch(() => localStorage.removeItem('tosrah_token'))
      .finally(() => setLoading(false));
  }, []);

  function applySession(res: AuthResponse) {
    localStorage.setItem('tosrah_token', res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
  }

  async function login(email: string, password: string) {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    applySession(res);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    applySession(res);
  }

  function logout() {
    localStorage.removeItem('tosrah_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}