import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DownloadCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Ready to send your first parcel?
        </h2>
        <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
          Join thousands of users already saving money and time with Amana.
          Start in minutes — no subscription needed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/auth"
            className="flex items-center gap-2 bg-white text-brand-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            Use the Web App <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-brand-200 text-sm">
          <span>📱 iOS App — Coming Soon</span>
          <span>🤖 Android App — Coming Soon</span>
        </div>
      </div>
    </section>
  );
}
