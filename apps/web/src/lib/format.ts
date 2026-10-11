const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const formatRupiah = (n: number) => rupiah.format(n);

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Menunggu pembayaran',
  PAID: 'Sudah dibayar',
  PACKED: 'Dikemas',
  SHIPPED: 'Dikirim',
  DONE: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const statusLabel = (s: string) => statusLabels[s] ?? s;