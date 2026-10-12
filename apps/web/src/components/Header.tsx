import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { AuthModal } from './AuthModal';
import { CartDrawer } from './CartDrawer';

export function Header() {
  const { user, logout } = useAuth();
  const { count, cartOpen, openCart, closeCart } = useCart();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);

  return (
    <header className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-4">
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-leaf-700 sm:text-2xl"
        >
          Tos<span className="text-grain-500">rah</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {user && (
            <button
              onClick={openCart}
              aria-label="Keranjang"
              className="relative rounded-full p-2.5 text-leaf-700 hover:bg-leaf-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 8H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-grain-400 text-[10px] font-bold text-ink">
                  {count}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1 text-sm sm:gap-3">
              <span className="hidden text-ink-soft sm:inline">
                Hai, <span className="font-medium text-ink">{user.name}</span>
              </span>
              <Link
                to="/pesanan"
                className="rounded-full px-3 py-2 font-medium text-leaf-700 hover:bg-leaf-50 sm:px-4"
              >
                Pesanan
              </Link>
              <button
                onClick={logout}
                className="rounded-full px-3 py-2 font-medium text-leaf-700 hover:bg-leaf-50 sm:px-4"
              >
                Keluar
              </button>
            </div>
          ) : (
            <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
              <button
                onClick={() => setModal('login')}
                className="rounded-full px-3 py-2 text-leaf-700 hover:bg-leaf-50 sm:px-4"
              >
                Masuk
              </button>
              <button
                onClick={() => setModal('register')}
                className="rounded-full bg-leaf-600 px-3 py-2 text-white hover:bg-leaf-700 sm:px-4"
              >
                Daftar
              </button>
            </nav>
          )}
        </div>
      </div>

      {modal && <AuthModal initialMode={modal} onClose={() => setModal(null)} />}
      {cartOpen && <CartDrawer onClose={closeCart} />}
    </header>
  );
}