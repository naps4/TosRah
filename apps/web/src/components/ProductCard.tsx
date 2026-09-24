import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { formatRupiah } from '../lib/format';
import type { Product } from '../lib/types';
import { AuthModal } from './AuthModal';
import { QuickAddModal } from './QuickAddModal';

export function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const soldOut = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  function handleAddClick(e: React.MouseEvent) {
    e.preventDefault(); // biar tidak ikut membuka halaman detail
    if (!user) {
      setShowAuth(true);
      return;
    }
    setShowQuickAdd(true);
  }

  return (
    <>
      <Link
        to={`/produk/${product.slug}`}
        className="flex flex-col overflow-hidden rounded-2xl border border-cream-dark bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-leaf-900/10"
      >
        <div className="relative aspect-square bg-leaf-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-6xl text-leaf-200">
              {product.name.charAt(0)}
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-leaf-700">
            {product.category.name}
          </span>
          {lowStock && (
            <span className="absolute right-3 top-3 rounded-full bg-chili px-2.5 py-1 text-xs font-semibold text-white">
              Sisa {product.stock}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 font-medium leading-snug">{product.name}</h3>
          <p className="text-xs text-ink-soft">
            {product.store.name} · {product.store.city}
          </p>

          <div className="mt-auto pt-3">
            <p className="text-lg font-semibold text-leaf-700">
              {formatRupiah(product.price)}{' '}
              <span className="text-xs font-normal text-ink-soft">
                / {product.unit}
              </span>
            </p>
            <button
              onClick={handleAddClick}
              disabled={soldOut}
              className="mt-3 w-full rounded-xl bg-grain-400 py-2 text-sm font-semibold text-ink transition hover:bg-grain-300 disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-ink-soft"
            >
              {soldOut ? 'Stok habis' : '+ Keranjang'}
            </button>
          </div>
        </div>
      </Link>

      {showQuickAdd && (
        <QuickAddModal product={product} onClose={() => setShowQuickAdd(false)} />
      )}
      {showAuth && (
        <AuthModal initialMode="login" onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}