export type Category = { id: string; name: string; slug: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string | null;
  store: { id: string; name: string; slug: string; city: string };
  category: Category;
};

export type Paginated<T> = {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    unit: string;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
    store: { id: string; name: string };
  };
};

export type Cart = { id: string; items: CartItem[] };