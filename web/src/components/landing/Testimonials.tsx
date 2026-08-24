const reviews = [
  {
    name: 'Yasmine B.',
    role: 'Sender',
    avatar: 'Y',
    rating: 5,
    text: 'I sent a 5kg package from Paris to Tunis for €18 instead of €80 with a traditional courier. The traveler was super professional and my parcel arrived in perfect condition!',
  },
  {
    name: 'Karim M.',
    role: 'Traveler',
    avatar: 'K',
    rating: 5,
    text: "I travel to Algeria every 2 months. With Amana I cover my luggage fees and even make a little extra. It's become a routine — I always check for parcels before flying.",
  },
  {
    name: 'Sarah L.',
    role: 'Sender',
    avatar: 'S',
    rating: 5,
    text: 'The escrow payment system gave me full confidence. I knew my money was safe until the delivery was confirmed. Highly recommend Amana!',
  },
  {
    name: 'Omar T.',
    role: 'Traveler',
    avatar: 'O',
    rating: 5,
    text: 'The app is incredibly easy to use. I post my trip, accept requests, and everything is handled — payments, notifications, tracking. It just works.',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Loved by our community</h2>
          <p className="text-xl text-gray-500">Real stories from real people.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {reviews.map(({ name, role, avatar, rating, text }) => (
            <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">
                  {avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
                <div className="ml-auto text-yellow-400 text-sm">{'★'.repeat(rating)}</div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
