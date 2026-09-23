import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';

export default function App() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <HomePage />
      </main>
    </>
  );
}