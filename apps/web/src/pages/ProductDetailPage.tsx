import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { formatRupiah } from '../lib/format';
import type { Product } from '../lib/types';
import { Breadcrumbs } from '../components/Breadcrumbs';

export function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<Product>(`/products/${slug}`),
    enabled: !!slug,
  });

  // reset tombol ke keadaan semula 2 detik setelah "Ditambahkan"
  useEffect(() => {
    if (status !== 'added') return;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleAdd() {
    if (!product || status === 'adding') return; // kunci: cegah klik dobel
    if (!user) {
      setError('Masuk dulu untuk menambah ke keranjang');
      return;
    }

    setError(null);
    setStatus('adding');
    try {
      await addItem(product.id, qty);
      setStatus('added');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah ke keranjang');
      setStatus('idle');
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-cream-dark" />
        <div className="space-y-3">
          <div className="h-6 w-2/3 animate-pulse rounded bg-cream-dark" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-cream-dark" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-soft">Produk tidak ditemukan.</p>
        <Link to="/" className="mt-3 inline-block text-leaf-700 underline">
          Kembali ke katalog
        </Link>
      </div>
    );
  }

  const soldOut = product.stock === 0;
  const busy = status === 'adding';

  return (
    <div className="py-8">
            <Breadcrumbs
        items={[
          { label: 'Beranda', to: '/' },
          {
            label: product.category.name,
            to: `/?kategori=${product.category.slug}`,
          },
          { label: product.name },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-leaf-50">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-8xl text-leaf-200">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        <div>
          <span className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
            {product.category.name}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Dijual oleh <span className="font-medium">{product.store.name}</span> ·{' '}
            {product.store.city}
          </p>

          <p className="mt-4 text-3xl font-semibold text-leaf-700">
            {formatRupiah(product.price)}{' '}
            <span className="text-sm font-normal text-ink-soft">/ {product.unit}</span>
          </p>

          <p
            className={`mt-1 text-sm font-medium ${
              product.stock <= 5 ? 'text-chili' : 'text-leaf-700'
            }`}
          >
            {soldOut
              ? 'Stok habis'
              : product.stock <= 5
                ? `Stok tinggal ${product.stock}`
                : `Stok tersedia: ${product.stock}`}
          </p>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-cream-dark">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={soldOut || busy}
                className="px-3 py-2 text-lg text-ink-soft hover:text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={soldOut || busy || qty >= product.stock}
                className="px-3 py-2 text-lg text-ink-soft hover:text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={soldOut || busy || status === 'added'}
              className="flex-1 rounded-full bg-grain-400 py-3 text-sm font-semibold text-ink transition hover:bg-grain-300 disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-ink-soft"
            >
              {soldOut
                ? 'Stok habis'
                : status === 'adding'
                  ? 'Menambah...'
                  : status === 'added'
                    ? '✓ Ditambahkan'
                    : `+ Keranjang (${qty})`}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-chili">{error}</p>}
        </div>
      </div>
    </div>
  );
}