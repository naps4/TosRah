import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { createPortal } from 'react-dom';

type Mode = 'login' | 'register';

export function AuthModal({
  initialMode,
  onClose,
}: {
  initialMode: Mode;
  onClose: () => void;
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal (
        <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6"
      > 
        <h2 className="font-display text-2xl font-semibold text-leaf-700">
          {mode === 'login' ? 'Masuk ke Tosrah' : 'Daftar akun baru'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          {mode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              required
              className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            minLength={8}
            required
            className="rounded-xl border border-cream-dark px-4 py-2.5 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
          />

          {error && <p className="text-sm text-chili">{error}</p>}

          <button
            disabled={submitting}
            className="mt-2 rounded-full bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="font-medium text-leaf-700 underline"
          >
            {mode === 'login' ? 'Daftar' : 'Masuk'}
          </button>
        </p>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-ink-soft hover:text-ink"
        >
          Tutup
        </button>
      </div>
    </div>,
    document.body,
  );
}