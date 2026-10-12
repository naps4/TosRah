import { useState, type FormEvent } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { formatDate } from '../lib/format';
import { useToast } from '../lib/toast-context';
import type { MyReview, ReviewList } from '../lib/types';
import { StarInput, Stars } from './Stars';

export function ProductReviews({
  slug,
  ratingAvg,
  ratingCount,
}: {
  slug: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviews = useQuery({
    queryKey: ['reviews', slug, page],
    queryFn: () => api<ReviewList>(`/products/${slug}/reviews?page=${page}`),
    placeholderData: keepPreviousData,
  });

  const mine = useQuery({
    queryKey: ['my-review', slug],
    queryFn: () => api<MyReview>(`/products/${slug}/reviews/mine`),
    enabled: !!user,
  });

  const myReview = mine.data?.review ?? null;
  const showForm = !!user && !!mine.data?.canReview && (!myReview || editing);
  const meta = reviews.data?.meta;

  function startEdit() {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment ?? '');
    setError(null);
    setEditing(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError('Pilih jumlah bintang dulu');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api(`/products/${slug}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      toast('Terima kasih, ulasanmu tersimpan');
      setEditing(false);
      setRating(0);
      setComment('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reviews', slug] }),
        queryClient.invalidateQueries({ queryKey: ['my-review', slug] }),
        queryClient.invalidateQueries({ queryKey: ['product', slug] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan ulasan');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="ulasan" className="mt-12 scroll-mt-20 border-t border-cream-dark pt-8">
      <h2 className="font-display text-2xl font-semibold">Ulasan pembeli</h2>

      {ratingCount === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Belum ada ulasan untuk produk ini.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
          <div>
            <p className="font-display text-5xl font-semibold text-leaf-700">
              {ratingAvg.toFixed(1)}
            </p>
            <Stars value={ratingAvg} className="mt-1 text-xl" />
            <p className="mt-1 text-sm text-ink-soft">{ratingCount} ulasan</p>
          </div>
          <ul className="w-full max-w-xs flex-1 space-y-1.5">
            {reviews.data?.distribution.map((d) => (
              <li key={d.star} className="flex items-center gap-2 text-xs text-ink-soft">
                <span className="w-6">{d.star} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
                  <span
                    className="block h-full rounded-full bg-grain-400"
                    style={{ width: `${(d.count / ratingCount) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        {!user && (
          <p className="text-sm text-ink-soft">
            Masuk dan beli produk ini untuk menulis ulasan.
          </p>
        )}
        {user && mine.data && !mine.data.canReview && (
          <p className="text-sm text-ink-soft">
            Hanya pembeli yang sudah membayar produk ini yang bisa menulis ulasan.
          </p>
        )}

        {user && myReview && !editing && (
          <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Ulasanmu</p>
              <button onClick={startEdit} className="text-sm text-leaf-700 hover:underline">
                Ubah
              </button>
            </div>
            <Stars value={myReview.rating} className="mt-1 text-lg" />
            {myReview.comment && (
              <p className="mt-2 text-sm text-ink-soft">{myReview.comment}</p>
            )}
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="rounded-2xl border border-cream-dark bg-white p-4">
            <p className="text-sm font-medium">
              {myReview ? 'Ubah ulasanmu' : 'Tulis ulasan'}
            </p>
            <StarInput value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Ceritakan kualitas produk, pengemasan, dan pengirimannya (opsional)"
              className="mt-2 w-full rounded-xl border border-cream-dark px-3 py-2 text-sm outline-none focus:border-leaf-400 focus:ring-2 focus:ring-leaf-200"
            />
            {error && <p className="mt-2 text-sm text-chili">{error}</p>}
            <div className="mt-3 flex items-center gap-3">
              <button
                disabled={submitting}
                className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-60"
              >
                {submitting ? 'Menyimpan...' : 'Kirim ulasan'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-ink-soft hover:text-ink"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {reviews.isLoading && (
        <div className="mt-6 h-20 animate-pulse rounded-2xl bg-cream-dark" />
      )}

      <ul className="mt-6 divide-y divide-cream-dark">
        {reviews.data?.items.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{r.userName}</p>
              <p className="text-xs text-ink-soft">{formatDate(r.createdAt)}</p>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={r.rating} className="text-sm" />
              <span className="text-[11px] text-leaf-600">✓ Pembeli terverifikasi</span>
            </div>
            {r.comment && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {r.comment}
              </p>
            )}
          </li>
        ))}
      </ul>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="rounded-full border border-cream-dark bg-white px-4 py-2 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-ink-soft">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
            className="rounded-full border border-cream-dark bg-white px-4 py-2 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </section>
  );
}