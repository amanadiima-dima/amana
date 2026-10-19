'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressOption {
  place_id: number;
  display_name: string;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'Address', required }: Props) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AddressOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) { setOptions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = (await res.json()) as AddressOption[];
        setOptions(data);
        setOpen(data.length > 0 && document.activeElement === inputRef.current);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const select = (opt: AddressOption) => {
    setQuery(opt.display_name);
    onChange(opt.display_name);
    setOpen(false);
    setOptions([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q); // keep parent in sync while typing
    search(q);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full border border-gray-200 rounded-xl ps-9 pe-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && options.length > 0 && (
        <ul className="absolute z-50 top-full start-0 end-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((opt) => (
            <li key={opt.place_id}>
              <button
                type="button"
                onMouseDown={() => select(opt)}
                className="w-full flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors text-start"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800">{opt.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
