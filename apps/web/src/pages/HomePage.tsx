import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Category, Paginated, Product } from '../lib/types';

export function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });

  const products = useQuery({
    queryKey: ['products', { q, category }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      return api<Paginated<Product>>(`/products?${params.toString()}`);
    },
  });

  return (
    <>
      <section className="py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-leaf-500">
          Belanja kebutuhan dapur
        </p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Sembako lengkap dari{' '}
          <span className="underline decoration-grain-400 decoration-4 underline-offset-4">
            toko-toko terpercaya
          </span>
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(searchInput.trim());
          }}
          className="mt-6 flex max-w-xl gap-2"
        >
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari beras, minyak, gula..."
            className="min-w-0 flex-1 rounded-full border border-cream-dark bg-white px-5 py-3 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
          />
          <button className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-white hover:bg-leaf-700">
            Cari
          </button>
        </form>
      </section>

      <div className="flex flex-wrap gap-2">
        <Chip active={category === null} onClick={() => setCategory(null)}>
          Semua
        </Chip>
        {categories.data?.map((c) => (
          <Chip
            key={c.id}
            active={category === c.slug}
            onClick={() => setCategory(c.slug)}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {products.data && (
        <p className="mt-6 text-sm text-ink-soft">
          {products.data.meta.total} produk ditemukan
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-cream-dark"
            />
          ))}
        {products.data?.items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.isError && (
        <p className="mt-8 rounded-xl bg-chili/10 p-4 text-sm text-chili">
          Gagal memuat produk: {products.error.message}. Pastikan backend
          jalan di localhost:3000.
        </p>
      )}

      {products.data?.items.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-leaf-200 p-8 text-center text-ink-soft">
          Belum ada produk yang cocok.
        </p>
      )}
    </>
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