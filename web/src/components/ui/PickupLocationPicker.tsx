'use client';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MapPin, Loader2 } from 'lucide-react';

function PickupMapLoading() {
  const t = useTranslations('pickup');
  return <div className="h-full w-full grid place-items-center text-gray-400 text-sm">{t('loadingMap')}</div>;
}

const PickupMap = dynamic(() => import('./PickupMap'), {
  ssr: false,
  loading: () => <PickupMapLoading />,
});

export interface PickupValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Fallback map centre (Paris) when no pin is set yet.
const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };

export default function PickupLocationPicker({
  value,
  onChange,
}: {
  value: PickupValue;
  onChange: (v: PickupValue) => void;
}) {
  const t = useTranslations('pickup');
  const [query, setQuery] = useState(value.address);
  const [options, setOptions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    clearTimeout(debounce.current);
    if (q.trim().length < 3) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = (await res.json()) as NominatimResult[];
        setOptions(data);
        setOpen(data.length > 0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const reverse = useCallback(
    async (lat: number, lng: number) => {
      onChange({ address: value.address, lat, lng }); // move pin immediately
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data?.display_name) {
          setQuery(data.display_name);
          onChange({ address: data.display_name, lat, lng });
        }
      } catch {
        /* keep the coords, no address */
      }
    },
    [onChange, value.address]
  );

  const pick = (o: NominatimResult) => {
    const lat = parseFloat(o.lat);
    const lng = parseFloat(o.lon);
    setQuery(o.display_name);
    setOpen(false);
    setOptions([]);
    onChange({ address: o.display_name, lat, lng });
  };

  const hasPin = value.lat != null && value.lng != null;

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...value, address: e.target.value });
            search(e.target.value);
          }}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={t('placeholder')}
          autoComplete="off"
          className="w-full border border-gray-200 rounded-xl ps-9 pe-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {loading && (
          <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        {open && options.length > 0 && (
          <ul className="absolute z-[1000] top-full start-0 end-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {options.map((o) => (
              <li key={o.place_id}>
                <button
                  type="button"
                  onMouseDown={() => pick(o)}
                  className="w-full flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-brand-50 text-start"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-800">{o.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2 h-56 rounded-xl overflow-hidden border border-gray-200">
        <PickupMap
          lat={hasPin ? (value.lat as number) : DEFAULT_CENTER.lat}
          lng={hasPin ? (value.lng as number) : DEFAULT_CENTER.lng}
          onPick={reverse}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {hasPin
          ? `📍 ${(value.lat as number).toFixed(5)}, ${(value.lng as number).toFixed(5)} — ${t('adjustHint')}`
          : t('setHint')}
      </p>
    </div>
  );
}
