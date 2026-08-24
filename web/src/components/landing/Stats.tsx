const stats = [
  { value: '50K+', label: 'Parcels Delivered' },
  { value: '12K+', label: 'Verified Travelers' },
  { value: '98%', label: 'Delivery Success Rate' },
  { value: '4.8★', label: 'Average Rating' },
];

export default function Stats() {
  return (
    <section className="py-20 bg-brand-600">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="text-4xl font-extrabold text-white mb-1">{value}</p>
            <p className="text-brand-100 text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
