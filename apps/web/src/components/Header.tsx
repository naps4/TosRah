import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { AuthModal } from './AuthModal';

export function Header() {
  const { user, logout } = useAuth();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);

  return (
    <header className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="font-display text-2xl font-semibold tracking-tight text-leaf-700">
          Tos<span className="text-grain-500">rah</span>
        </a>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-soft">
              Hai, <span className="font-medium text-ink">{user.name}</span>
            </span>
            <button
              onClick={logout}
              className="rounded-full px-4 py-2 font-medium text-leaf-700 hover:bg-leaf-50"
            >
              Keluar
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-2 text-sm font-medium">
            <button
              onClick={() => setModal('login')}
              className="rounded-full px-4 py-2 text-leaf-700 hover:bg-leaf-50"
            >
              Masuk
            </button>
            <button
              onClick={() => setModal('register')}
              className="rounded-full bg-leaf-600 px-4 py-2 text-white hover:bg-leaf-700"
            >
              Daftar
            </button>
          </nav>
        )}
      </div>

      {modal && <AuthModal initialMode={modal} onClose={() => setModal(null)} />}
    </header>
  );
}