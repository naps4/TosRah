import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './lib/auth-context';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartProvider } from './lib/cart-context.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderDetailPage } from './pages/OrderDetailPage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'produk/:slug', element: <ProductDetailPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'pesanan/:id', element: <OrderDetailPage /> },
      { path: 'pesanan', element: <OrdersPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);