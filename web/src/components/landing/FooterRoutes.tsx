'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Links to the routes that have upcoming trips; each opens the home search with that route.
export default function FooterRoutes() {
  const t = useTranslations('landing.footer');
  const [routes, setRoutes] = useState<{ originCity: string; destinationCity: string }[]>([]);
  useEffect(() => {
    fetch(`${BASE_URL}/trips/popular-routes`).then((r) => r.json()).then((d) => setRoutes(d.routes || [])).catch(() => {});
  }, []);
  const unique = routes.filter((r, i) => routes.findIndex((x) => x.originCity === r.originCity && x.destinationCity === r.destinationCity) === i).slice(0, 6);
  if (!unique.length) return null;
  return (
    <div>
      <h4 className="text-white font-semibold mb-4">{t('popularRoutes')}</h4>
      <ul className="space-y-2 text-sm">
        {unique.map((r) => (
          <li key={`${r.originCity}-${r.destinationCity}`}>
            <Link href={`/?from=${encodeURIComponent(r.originCity)}&to=${encodeURIComponent(r.destinationCity)}#trips`} className="hover:text-white transition-colors">
              {r.originCity} <span className="rtl:hidden">→</span><span className="hidden rtl:inline">←</span> {r.destinationCity}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
