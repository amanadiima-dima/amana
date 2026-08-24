import Link from 'next/link';
import { Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <Package className="w-5 h-5 text-brand-500" /> Amana
          </Link>
          <p className="text-sm leading-relaxed">
            Trusted peer-to-peer parcel delivery connecting senders with travelers worldwide.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
            <li><Link href="/auth" className="hover:text-white transition-colors">Get Started</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">For Users</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth" className="hover:text-white transition-colors">Send a Parcel</Link></li>
            <li><Link href="/auth" className="hover:text-white transition-colors">Become a Traveler</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-sm">
        <p>© {new Date().getFullYear()} Amana. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Made with ❤️ for travelers and senders everywhere.</p>
      </div>
    </footer>
  );
}
