export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="font-display text-2xl font-semibold tracking-tight text-leaf-700">
          Tos<span className="text-grain-500">rah</span>
        </a>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <button className="rounded-full px-4 py-2 text-leaf-700 hover:bg-leaf-50">Masuk</button>
          <button className="rounded-full bg-leaf-600 px-4 py-2 text-white hover:bg-leaf-700">Daftar</button>
        </nav>
      </div>
    </header>
  );
}