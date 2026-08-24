import Link from 'next/link';
import { ArrowRight, Shield, Star } from 'lucide-react';

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-brand-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            <Star className="w-4 h-4 fill-brand-500 text-brand-500" />
            Trusted by thousands of travelers
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
            Send parcels with
            <span className="text-brand-600"> travelers</span>
            <br />going your way
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            Amana connects people who need to send parcels with travelers already heading
            to the destination. Cheaper, faster, and more personal than traditional couriers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 hover:shadow-xl hover:scale-105"
            >
              Start Sending <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 border-2 border-brand-200 text-brand-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-50 transition-all"
            >
              Become a Carrier
            </Link>
          </div>
          <div className="flex items-center gap-6 mt-10 text-sm text-gray-500">
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> Secure payments</div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> ID verified users</div>
            <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-500" /> Escrow protection</div>
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
                  <p className="font-semibold text-sm">Ahmed K.</p>
                  <div className="flex">{'⭐'.repeat(5)}</div>
                </div>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Verified ✓</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">Trip</p>
                <p className="font-bold">Paris → Algiers</p>
                <p className="text-sm text-gray-500 mt-1">Dec 25 · Up to 10kg · €3/kg</p>
              </div>
              <button className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm">
                Send with Ahmed →
              </button>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg">
              📦 Delivered!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700">
              💰 Saved €45 vs courier
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
