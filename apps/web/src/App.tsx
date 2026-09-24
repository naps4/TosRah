import { Outlet } from 'react-router';
import { Header } from './components/Header';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <>
      <ScrollToTop/>  
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <Outlet />
      </main>
    </>
  );
}