import { Shield, MapPin, Star, Bell, CreditCard, Zap } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'ID Verified Users',
    desc: 'Every traveler and sender submits a government-issued ID. We verify before they can transact.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: CreditCard,
    title: 'Secure Escrow Payments',
    desc: 'Your money is held safely and only released to the traveler after successful delivery.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    desc: 'Track your parcel every step of the way with live status updates and photo proof on delivery.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Star,
    title: 'Two-Way Reviews',
    desc: 'Both senders and travelers rate each other after every delivery. Trust is built over time.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    desc: 'Get notified the moment your booking is accepted, your parcel is picked up, or delivered.',
    color: 'text-red-600 bg-red-50',
  },
  {
    icon: Zap,
    title: 'Up to 70% Cheaper',
    desc: 'Travelers set their own price. You get competitive rates far below traditional courier services.',
    color: 'text-orange-600 bg-orange-50',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Everything you need</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Amana is built around trust, transparency, and simplicity.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
