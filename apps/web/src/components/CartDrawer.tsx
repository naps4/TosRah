import { createPortal } from 'react-dom';
import { useCart } from '../lib/cart-context';
import { formatRupiah } from '../lib/format';
import { useNavigate } from 'react-router';

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const items = cart?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-50 bg-ink/40">
      <div
        onClick={(e) => e.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-md flex-col bg-white"
      >
        <div className="flex items-center justify-between border-b border-cream-dark p-4">
          <h2 className="font-display text-xl font-semibold">Keranjang</h2>
          <button onClick={onClose} className="text-sm text-ink-soft hover:text-ink">
            Tutup
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 && (
            <p className="mt-8 text-center text-sm text-ink-soft">
              Keranjang masih kosong.
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="h-16 w-16 shrink-0 rounded-xl bg-leaf-50" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-ink-soft">{item.product.store.name}</p>
                  <p className="mt-1 text-sm font-semibold text-leaf-700">
                    {formatRupiah(item.product.price)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-full border border-cream-dark">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateItem(item.id, item.quantity - 1)
                            : removeItem(item.id)
                        }
                        className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          item.quantity < item.product.stock &&
                          updateItem(item.id, item.quantity + 1)
                        }
                        className="flex h-9 w-9 items-center justify-center text-ink-soft hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-1 py-2 text-xs text-chili hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {items.length > 0 && (
          <div className="border-t border-cream-dark p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Total</span>
              <span className="font-semibold">{formatRupiah(total)}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
              className="mt-3 w-full rounded-full bg-leaf-600 py-3 text-sm font-semibold text-white hover:bg-leaf-700"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}