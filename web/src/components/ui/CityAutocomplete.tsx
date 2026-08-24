'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface CityOption {
  label: string;   // "Paris, France"
  city: string;    // "Paris"
  country: string; // "France"
}

interface Props {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CityAutocomplete({ value, onChange, placeholder = 'City', required }: Props) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync if parent resets value
  useEffect(() => { setQuery(value); }, [value]);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setOptions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=7&featuretype=city&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();

        const seen = new Set<string>();
        const results: CityOption[] = [];

        for (const item of data) {
          const addr = item.address || {};
          const city =
            addr.city || addr.town || addr.village || addr.municipality ||
            addr.county || item.name;
          const country = addr.country || '';
          if (!city) continue;
          const label = country ? `${city}, ${country}` : city;
          if (seen.has(label)) continue;
          seen.add(label);
          results.push({ label, city, country });
        }

        setOptions(results);
        setOpen(results.length > 0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const select = (opt: CityOption) => {
    setQuery(opt.label);
    onChange(opt.city);
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
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && options.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <li key={opt.label}>
              <button
                type="button"
                onMouseDown={() => select(opt)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-900">{opt.city}</span>
                  {opt.country && <span className="text-gray-400 ml-1">{opt.country}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
