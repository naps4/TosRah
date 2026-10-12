import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatRupiah } from '../lib/format';
import type { Paginated, Product } from '../lib/types';

export function SearchBox({
  value,
  onSubmit,
}: {
  value: string;
  onSubmit: (q: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // jeda 300 ms supaya API tidak ditembak tiap ketukan
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // tutup dropdown kalau klik di luar
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const suggestions = useQuery({
    queryKey: ['suggest', debounced],
    queryFn: () =>
      api<Paginated<Product>>(
        `/products?q=${encodeURIComponent(debounced)}&limit=5`,
      ),
    enabled: debounced.length >= 2,
  });

  function submit(e?: FormEvent) {
    e?.preventDefault();
    setOpen(false);
    onSubmit(input.trim());
  }

  const items = suggestions.data?.items ?? [];
  const showDropdown = open && debounced.length >= 2;

  return (
    <div ref={boxRef} className="relative mt-6 max-w-xl">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="Cari beras, minyak, gula..."
          aria-label="Cari produk"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-cream-dark bg-white px-5 py-3 text-sm text-ink outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
        />
        <button className="rounded-full bg-grain-400 px-6 py-3 text-sm font-semibold text-ink hover:bg-grain-300">
          Cari
        </button>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-cream-dark bg-white text-ink shadow-xl">
          {suggestions.isLoading && (
            <p className="px-4 py-3 text-sm text-ink-soft">Mencari...</p>
          )}
          {suggestions.data && items.length === 0 && (
            <p className="px-4 py-3 text-sm text-ink-soft">
              Tidak ada produk untuk “{debounced}”
            </p>
          )}
          <ul>
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/produk/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-leaf-50"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-leaf-50">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-lg text-leaf-200">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-ink-soft">{p.store.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-leaf-700">
                    {formatRupiah(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => submit()}
              className="w-full border-t border-cream-dark px-4 py-2.5 text-left text-sm font-medium text-leaf-700 hover:bg-leaf-50"
            >
              Lihat semua hasil “{debounced}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}