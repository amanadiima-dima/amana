'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tripApi, parcelApi, bookingApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Star, Shield, Loader2, Package, Weight, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

// ── Booking management panel (traveler's own trip) ────────────────────────────
function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function TripBookingsPanel({ tripId }: { tripId: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const load = () =>
    tripApi.getBookings(tripId)
      .then(({ data }) => setBookings(data.bookings || []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [tripId]);

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    setResponding(bookingId);
    try {
      await bookingApi.respond(bookingId, action);
      await load();
    } finally {
      setResponding(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
    </div>
  );

  const pending = bookings.filter((b) => b.status === 'PENDING');
  const others = bookings.filter((b) => b.status !== 'PENDING');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-brand-600" />
        <h2 className="font-bold text-gray-900 text-lg">Booking Requests</h2>
        {pending.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-gray-600">No booking requests yet</p>
          <p className="text-sm text-gray-400 mt-1">Senders will appear here once they request your trip.</p>
        </div>
      )}

      {/* Pending bookings */}
      {pending.map((b) => (
        <div key={b.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {b.parcelRequest?.sender?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{b.parcelRequest?.sender?.name}</p>
                <p className="text-xs text-gray-400">{b.parcelRequest?.sender?.phone}</p>
              </div>
            </div>
            <BookingStatusBadge status={b.status} />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
            <p className="text-sm font-medium text-gray-900">📦 {b.parcelRequest?.description}</p>
            <p className="text-xs text-gray-500">
              ⚖️ {b.parcelRequest?.weightKg} kg
              {b.parcelRequest?.fragile && ' · 🔴 Fragile'}
              {b.parcelRequest?.estimatedValue && ` · Value: €${b.parcelRequest.estimatedValue}`}
            </p>
            <p className="text-xs text-gray-500">📍 Delivery: {b.parcelRequest?.deliveryAddress}</p>
            {b.payment?.grossAmount && (
              <p className="text-xs text-gray-500">💶 Payment: €{b.payment.grossAmount} ({b.payment.status})</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              disabled={responding === b.id}
              onClick={() => respond(b.id, 'accept')}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {responding === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Accept</>}
            </button>
            <button
              disabled={responding === b.id}
              onClick={() => respond(b.id, 'reject')}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {responding === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Reject</>}
            </button>
          </div>
        </div>
      ))}

      {/* Non-pending bookings */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Previous requests</p>
          {others.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                {b.parcelRequest?.sender?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{b.parcelRequest?.sender?.name}</p>
                <p className="text-xs text-gray-500 truncate">📦 {b.parcelRequest?.description} · ⚖️ {b.parcelRequest?.weightKg}kg</p>
              </div>
              <BookingStatusBadge status={b.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main trip detail page ─────────────────────────────────────────────────────
export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [trip, setTrip] = useState<any>(null);
  const [myParcels, setMyParcels] = useState<any[]>([]);
  const [selectedParcel, setSelectedParcel] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      tripApi.getById(id),
      parcelApi.getMyParcels(),
    ]).then(([tripRes, parcelRes]) => {
      setTrip(tripRes.data.trip);
      const unbookedParcels = (parcelRes.data.parcels || []).filter((p: any) => !p.booking);
      setMyParcels(unbookedParcels);
    }).catch(() => router.push('/parcels/search'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedParcel) return setError('Please select a parcel first.');
    setBooking(true); setError('');
    try {
      await bookingApi.create(id, selectedParcel);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create booking.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
    </div>
  );

  if (!trip) return null;

  const isOwnTrip = trip.traveler?.id === user?.id;

  return (
    <div className="max-w-xl">
      <Link
        href={isOwnTrip ? '/trips' : '/parcels/search'}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {isOwnTrip ? 'Back to My Trips' : 'Back to search'}
      </Link>

      {/* Trip card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.originCity} → {trip.destinationCity}</h1>
            <p className="text-gray-500 mt-1">
              🗓 {new Date(trip.departureAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">{trip.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Available capacity</p>
            <p className="font-bold text-gray-900 text-lg">{trip.availableWeightKg ?? trip.maxWeightKg} kg</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Price per kg</p>
            <p className="font-bold text-gray-900 text-lg">€{trip.pricePerKg}</p>
          </div>
        </div>

        {trip.notes && (
          <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            📝 {trip.notes}
          </p>
        )}
      </div>

      {/* Traveler (only show when viewing someone else's trip) */}
      {trip.traveler && !isOwnTrip && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4 flex items-center gap-4">
          <Link href={`/traveler/${trip.traveler.id}`}>
            <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">
              {trip.traveler.name?.charAt(0)}
            </div>
          </Link>
          <div className="flex-1">
            <Link href={`/traveler/${trip.traveler.id}`} className="font-bold text-gray-900 hover:text-brand-600 transition-colors">
              {trip.traveler.name}
            </Link>
            <div className="flex items-center gap-3 mt-0.5">
              {(trip.traveler.rating ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {Number(trip.traveler.rating).toFixed(1)}
                  {trip.traveler.reviewCount > 0 && <span className="text-gray-400">· {trip.traveler.reviewCount} reviews</span>}
                </span>
              )}
              {trip.traveler.isVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Own trip: booking management */}
      {isOwnTrip ? (
        <TripBookingsPanel tripId={id} />
      ) : done ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-green-700 text-lg">Booking request sent!</p>
          <p className="text-sm text-green-600 mt-1 mb-4">The traveler will accept or reject your request.</p>
          <Link href="/bookings" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
            View my bookings →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Send a parcel with this trip</h2>

          {myParcels.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600 mb-3">You don't have any parcels yet</p>
              <p className="text-xs text-gray-400 mb-4">Create a parcel request first, then come back to book.</p>
              <Link href="/parcels/new" className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
                + Create a parcel
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {myParcels.map((p: any) => (
                  <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedParcel === p.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="parcel" value={p.id} checked={selectedParcel === p.id}
                      onChange={() => setSelectedParcel(p.id)} className="accent-brand-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{p.description}</p>
                      <p className="text-xs text-gray-500">⚖️ {p.weightKg}kg · 📍 {p.deliveryAddress}</p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedParcel && (() => {
                const p = myParcels.find((x: any) => x.id === selectedParcel);
                const cost = p ? (p.weightKg * trip.pricePerKg).toFixed(2) : null;
                return cost ? (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600">
                    💶 Estimated cost: <span className="font-bold text-gray-900">€{cost}</span>
                    <span className="text-gray-400"> (platform fee included)</span>
                  </div>
                ) : null;
              })()}

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

              <button onClick={handleBook} disabled={booking || !selectedParcel}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60">
                {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Booking →'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
