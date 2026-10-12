import { useState } from 'react';

// bintang tampilan, mendukung pecahan (misal 4.3)
export function Stars({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={`Rating ${value} dari 5`}
      className={`relative inline-block leading-none ${className}`}
    >
      <span className="text-ink/15">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-grain-400"
        style={{ width: `${(value / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

// bintang input untuk menulis ulasan (tombol 40px biar enak disentuh)
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div
      role="radiogroup"
      aria-label="Beri rating"
      onMouseLeave={() => setHover(0)}
      className="mt-1 flex"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} bintang`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`h-10 w-10 text-3xl leading-none transition ${
            (hover || value) >= n ? 'text-grain-400' : 'text-ink/15'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}