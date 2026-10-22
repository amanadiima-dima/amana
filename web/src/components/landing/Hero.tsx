import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Shield, Star, Plane } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('landing.hero');
  return (
    <section className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-brand-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            <Star className="w-4 h-4 fill-brand-500 text-brand-500" />
            {t('badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
            {t('titleLine1')}
            <span className="text-brand-600"> {t('titleHighlight')}</span>
            <br />{t('titleLine2')}
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            {t('description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/parcels/search"
              className="flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 hover:shadow-xl hover:scale-105"
            >
              {t('startSending')} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </Link>
            <Link
              href="/trips/new"
              className="flex items-center justify-center gap-2 bg-amber-400 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-amber-300 transition-all shadow-lg shadow-amber-100 hover:shadow-xl hover:scale-105"
            >
              <Plane className="w-5 h-5 rtl:-scale-x-100" /> {t('becomeCarrier')}
            </Link>
          </div>
          <div className="flex items-center gap-6 mt-10 text-sm text-gray-500">
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> {t('securePayments')}</div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> {t('idVerified')}</div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> {t('escrowProtection')}</div>
          </div>
        </div>

        {/* Mockup card */}
        <div className="flex justify-center">
          <div className="relative w-72">
            {/* Main card */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">A</div>
                <div>
                  <p className="font-semibold text-sm">{t('mockupTraveler')}</p>
                  <div className="flex">{'⭐'.repeat(5)}</div>
                </div>
                <span className="ms-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{t('mockupVerified')}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">{t('mockupTripLabel')}</p>
                <p className="font-bold">{t('mockupTrip')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('mockupTripDetails')}</p>
              </div>
              <div aria-hidden className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm text-center">
                {t('mockupCta')}
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -end-4 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg">
              {t('mockupDelivered')}
            </div>
            <div className="absolute -bottom-4 -start-4 bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700">
              {t('mockupSaved')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
