import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { formatRupiah } from '../lib/format';
import type { Address } from '../lib/types';

const emptyForm = {
  label: '',
  recipient: '',
  phone: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
};

const fields: { key: keyof typeof emptyForm; label: string }[] = [
  { key: 'label', label: 'Label (Rumah / Kantor)' },
  { key: 'recipient', label: 'Nama penerima' },
  { key: 'phone', label: 'No. HP' },
  { key: 'street', label: 'Alamat lengkap' },
  { key: 'city', label: 'Kota / Kabupaten' },
  { key: 'province', label: 'Provinsi' },
  { key: 'postalCode', label: 'Kode pos' },
];

export function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart } = useCart();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api<Address[]>('/addresses'),
    enabled: !!user,
  });

  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);
  const addressId = selected ?? addresses[0]?.id ?? null;
  const formOpen = showForm || (!isLoading && addresses.length === 0);

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const created = await api<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelected(created.id);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan alamat');
    }
  }

  async function pay() {
    if (!addressId) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await api<{ redirectUrl: string }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ addressId }),
      });
      window.location.href = res.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout gagal');
      setSubmitting(false);
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <p className="mt-12 text-center text-sm text-ink-soft">
        Silakan login dulu untuk checkout.{' '}
        <Link to="/" className="text-leaf-700 hover:underline">
          Kembali ke beranda
        </Link>
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-ink-soft">
        Keranjang masih kosong.{' '}
        <Link to="/" className="text-leaf-700 hover:underline">
          Belanja dulu
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
      <section>
        <h1 className="font-display text-2xl font-semibold">Alamat pengiriman</h1>

        <ul className="mt-4 flex flex-col gap-3">
          {addresses.map((a) => (
            <li key={a.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${
                  addressId === a.id ? 'border-leaf-600 bg-leaf-50' : 'border-cream-dark bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addressId === a.id}
                  onChange={() => setSelected(a.id)}
                />
                <div className="text-sm">
                  <p className="font-medium">
                    {a.label} · {a.recipient} · {a.phone}
                  </p>
                  <p className="text-ink-soft">
                    {a.street}, {a.city}, {a.province} {a.postalCode}
                  </p>
                </div>
              </label>
            </li>
          ))}
        </ul>

        {!formOpen && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-leaf-700 hover:underline"
          >
            + Tambah alamat baru
          </button>
        )}

        {formOpen && (
          <form onSubmit={saveAddress} className="mt-4 grid gap-3 rounded-2xl border border-cream-dark bg-white p-4">
            {fields.map((f) => (
              <label key={f.key} className="text-sm">
                <span className="text-ink-soft">{f.label}</span>
                <input
                  required
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-cream-dark px-3 py-2"
                />
              </label>
            ))}
            <div className="flex gap-2">
              <button className="rounded-full bg-leaf-600 px-5 py-2 text-sm font-semibold text-white hover:bg-leaf-700">
                Simpan alamat
              </button>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-ink-soft hover:text-ink"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <aside className="h-fit rounded-2xl border border-cream-dark bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Ringkasan</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>
                {i.product.name} × {i.quantity}
              </span>
              <span>{formatRupiah(i.quantity * i.product.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-cream-dark pt-3 text-sm font-semibold">
          <span>Total</span>
          <span>{formatRupiah(total)}</span>
        </div>
        {error && <p className="mt-3 text-sm text-chili">{error}</p>}
        <button
          onClick={pay}
          disabled={!addressId || submitting}
          className="mt-4 w-full rounded-full bg-leaf-600 py-3 text-sm font-semibold text-white hover:bg-leaf-700 disabled:opacity-50"
        >
          {submitting ? 'Memproses...' : 'Bayar sekarang'}
        </button>
      </aside>
    </div>
  );
}