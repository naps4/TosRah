import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import { useAuth } from './auth-context';
import type { Cart } from './types';
import { useToast } from './toast-context';

type CartState = {
  cart: Cart | null;
  count: number;
  loading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api<Cart>('/cart');
      setCart(data);
    } finally {
      setLoading(false);
    }
  }

  // muat ulang keranjang setiap kali status login berubah
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function addItem(productId: string, quantity: number) {
    const data = await api<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    setCart(data);
    const name = data.items.find((i) => i.product.id === productId)?.product.name;
    toast(name ? `${name} ditambahkan ke keranjang` : 'Ditambahkan ke keranjang');
  }

  async function updateItem(itemId: string, quantity: number) {
    const data = await api<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    setCart(data);
  }

  async function removeItem(itemId: string) {
    const data = await api<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    setCart(data);
  }

  const count = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ cart, count, loading, addItem, updateItem, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider');
  return ctx;
}