export type Category = { id: string; name: string; slug: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  stock: number;
  soldCount: number;
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

export type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
};

export type Order = {
  id: string;
  code: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  address: Address;
  payment: { status: string; method: string | null } | null;
  subOrders: {
    id: string;
    subtotal: number;
    status: string;
    store: { id: string; name: string };
    items: { id: string; productName: string; price: number; quantity: number }[];
  }[];
};