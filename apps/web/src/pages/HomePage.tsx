import { useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { SearchBox } from '../components/SearchBox';
import { api } from '../lib/api';
import type { Category, Paginated, Product } from '../lib/types';

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga terendah' },
  { value: 'price_desc', label: 'Harga tertinggi' },
];

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('kategori');
  const sort = params.get('urut') ?? 'newest';
  const min = params.get('min') ?? '';
  const max = params.get('max') ?? '';
  const page = Number(params.get('hal') ?? 1) || 1;

  const [minInput, setMinInput] = useState(min);
  const [maxInput, setMaxInput] = useState(max);

  const hasFilter = !!(q || category || min || max || sort !== 'newest');

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    // filter berubah -> kembali ke halaman 1
    if (!('hal' in changes)) next.delete('hal');
    setParams(next);
  }

  function goPage(n: number) {
    update({ hal: n > 1 ? String(n) : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applyPrice(e: FormEvent) {
    e.preventDefault();
    update({ min: minInput.trim() || null, max: maxInput.trim() || null });
  }

  function resetAll() {
    setParams(new URLSearchParams());
    setMinInput('');
    setMaxInput('');
  }

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });

  const products = useQuery({
    queryKey: ['products', { q, category, sort, min, max, page }],
    queryFn: () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (category) p.set('category', category);
      if (sort !== 'newest') p.set('sort', sort);
      if (min) p.set('minPrice', min);
      if (max) p.set('maxPrice', max);
      p.set('page', String(page));
      return api<Paginated<Product>>(`/products?${p.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const meta = products.data?.meta;

  return (
    <>
      <section className="mt-6 rounded-3xl bg-leaf-700 px-6 py-10 text-white sm:px-12 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-grain-300">
          Belanja kebutuhan dapur
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Sembako lengkap dari{' '}
          <span className="underline decoration-grain-400 decoration-4 underline-offset-4">
            toko-toko terpercaya
          </span>
        </h1>
        <SearchBox
          key={q}
          value={q}
          onSubmit={(v) => update({ q: v || null })}
        />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { title: 'Pembayaran aman', desc: 'Diproses lewat Midtrans' },
          { title: 'Banyak toko pilihan', desc: 'Satu checkout untuk beberapa toko' },
          { title: 'Stok selalu terbaru', desc: 'Diperbarui otomatis setiap pesanan' },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-cream-dark bg-white px-4 py-3"
          >
            <p className="text-sm font-semibold text-leaf-700">{f.title}</p>
            <p className="text-xs text-ink-soft">{f.desc}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Chip active={category === null} onClick={() => update({ kategori: null })}>
          Semua
        </Chip>
        {categories.data?.map((c) => (
          <Chip
            key={c.id}
            active={category === c.slug}
            onClick={() => update({ kategori: c.slug })}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-cream-dark bg-white p-4">
        <label className="text-xs text-ink-soft">
          Urutkan
          <select
            value={sort}
            onChange={(e) =>
              update({ urut: e.target.value === 'newest' ? null : e.target.value })
            }
            className="mt-1 block rounded-xl border border-cream-dark bg-white px-3 py-2 text-sm text-ink"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={applyPrice} className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-ink-soft">
            Harga min
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder="0"
              className="mt-1 block w-28 rounded-xl border border-cream-dark px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-xs text-ink-soft">
            Harga maks
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="Tanpa batas"
              className="mt-1 block w-28 rounded-xl border border-cream-dark px-3 py-2 text-sm text-ink"
            />
          </label>
          <button className="rounded-xl bg-leaf-600 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-700">
            Terapkan
          </button>
        </form>

        {hasFilter && (
          <button
            onClick={resetAll}
            className="ml-auto text-sm text-leaf-700 hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {meta && (
        <p className="mt-6 text-sm text-ink-soft">
          {meta.total} produk ditemukan{q && <> untuk “{q}”</>}
        </p>
      )}

      <div
        className={`mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${
          products.isPlaceholderData ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        {products.isLoading &&
          Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        {products.data?.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.isError && (
        <p className="mt-8 rounded-xl bg-chili/10 p-4 text-sm text-chili">
          Gagal memuat produk. Coba muat ulang halaman beberapa saat lagi.
        </p>
      )}

      {products.data?.items.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-leaf-200 p-8 text-center text-ink-soft">
          <p>Belum ada produk yang cocok.</p>
          {hasFilter && (
            <button
              onClick={resetAll}
              className="mt-2 text-sm text-leaf-700 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="rounded-full border border-cream-dark bg-white px-4 py-2 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-ink-soft">
            Halaman {meta.page} dari {meta.totalPages}
          </span>
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= meta.totalPages}
            className="rounded-full border border-cream-dark bg-white px-4 py-2 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white">
      <div className="aspect-square animate-pulse bg-cream-dark" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-cream-dark" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-cream-dark" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-cream-dark" />
        <div className="h-9 animate-pulse rounded-xl bg-cream-dark" />
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-leaf-600 text-white'
          : 'border border-cream-dark bg-white text-ink-soft hover:border-leaf-300'
      }`}
    >
      {children}
    </button>
  );
}