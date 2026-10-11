import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { formatDate, formatRupiah, statusLabel } from '../lib/format';
import type { Order } from '../lib/types';

function badgeClass(status: string) {
  if (status === 'PENDING_PAYMENT') return 'bg-grain-400/20 text-ink';
  if (status === 'CANCELLED') return 'bg-chili/10 text-chili';
  return 'bg-leaf-100 text-leaf-700';
}

export function OrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Order[]>('/orders'),
    enabled: !!user,
  });

  if (authLoading || (user && isLoading)) return null;

  if (!user) {
    return (
      <p className="mt-12 text-center text-sm text-ink-soft">
        Silakan login dulu untuk melihat pesanan.
      </p>
    );
  }

  return (
    <div className="mt-8 max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Pesanan saya</h1>

      {orders.length === 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          Belum ada pesanan.{' '}
          <Link to="/" className="text-leaf-700 hover:underline">
            Mulai belanja
          </Link>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {orders.map((o) => {
          const items = o.subOrders.flatMap((s) => s.items);
          const first = items[0];
          return (
            <li key={o.id}>
              <Link
                to={`/pesanan/${o.id}`}
                className="block rounded-2xl border border-cream-dark bg-white p-4 hover:border-leaf-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{o.code}</p>
                    <p className="text-xs text-ink-soft">{formatDate(o.createdAt)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(o.status)}`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-ink-soft">
                  {first?.productName}
                  {items.length > 1 && ` dan ${items.length - 1} produk lainnya`}
                </p>
                <p className="mt-1 text-sm font-semibold">{formatRupiah(o.totalAmount)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}