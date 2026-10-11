import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { formatRupiah, statusLabel } from '../lib/format';
import type { Order } from '../lib/types';

export function OrderDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<Order>(`/orders/${id}`),
    enabled: !!user && !!id,
    // webhook Midtrans bisa telat, cek ulang selama masih menunggu pembayaran
    refetchInterval: (q) =>
      q.state.data?.status === 'PENDING_PAYMENT' ? 5000 : false,
  });

  if (authLoading || isLoading) return null;

  if (!user) {
    return <p className="mt-12 text-center text-sm text-ink-soft">Silakan login dulu.</p>;
  }

  if (error || !order) {
    return (
      <p className="mt-12 text-center text-sm text-ink-soft">
        Pesanan tidak ditemukan.{' '}
        <Link to="/" className="text-leaf-700 hover:underline">
          Ke beranda
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-8 max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Pesanan {order.code}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Status: <span className="font-medium text-ink">{statusLabel(order.status)}</span>
        {order.status === 'PENDING_PAYMENT' && ' (halaman ini otomatis diperbarui)'}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {order.subOrders.map((s) => (
          <div key={s.id} className="rounded-2xl border border-cream-dark bg-white p-4">
            <div className="flex justify-between text-sm">
              <p className="font-medium">{s.store.name}</p>
              <p className="text-ink-soft">{statusLabel(s.status)}</p>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {s.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>
                    {i.productName} × {i.quantity}
                  </span>
                  <span>{formatRupiah(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span>Total</span>
        <span>{formatRupiah(order.totalAmount)}</span>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Dikirim ke {order.address.recipient}, {order.address.street}, {order.address.city},{' '}
        {order.address.province} {order.address.postalCode}
      </p>

      <Link to="/" className="mt-6 inline-block text-sm text-leaf-700 hover:underline">
        Lanjut belanja
      </Link>
    </div>
  );
}