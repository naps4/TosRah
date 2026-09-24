import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../lib/cart-context';
import { formatRupiah } from '../lib/format';
import type { Product } from '../lib/types';

export function QuickAddModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await addItem(product.id, qty);
      setDone(true);
      setTimeout(onClose, 900); // tutup sendiri setelah sukses
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah ke keranjang');
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6"
      >
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium">Ditambahkan ke keranjang</p>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <div className="h-16 w-16 shrink-0 rounded-xl bg-leaf-50" />
              <div>
                <p className="text-sm font-medium leading-snug">{product.name}</p>
                <p className="text-xs text-ink-soft">
                  {product.store.name} · {product.store.city}
                </p>
                <p className="mt-1 text-sm font-semibold text-leaf-700">
                  {formatRupiah(product.price)}{' '}
                  <span className="text-xs font-normal text-ink-soft">
                    / {product.unit}
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-soft">
              Jumlah
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-cream-dark">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2 text-lg text-ink-soft hover:text-ink"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                  className="px-3.5 py-2 text-lg text-ink-soft hover:text-ink disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-ink-soft">
                Stok tersedia: {product.stock}
              </span>
            </div>

            {error && <p className="mt-3 text-sm text-chili">{error}</p>}

            <div className="mt-6 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-cream-dark py-2.5 text-sm font-medium text-ink-soft hover:bg-cream"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-full bg-leaf-600 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
              >
                {submitting ? 'Menambah...' : `Tambah (${qty})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}