import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { bookingApi, paymentApi, reviewApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginVertical: 12 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Text style={{ fontSize: 32 }}>{s <= value ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function BookingDetailScreen({ route, navigation }: any) {
  const { bookingId } = route.params;
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => bookingApi.getById(bookingId).then(({ data }) => setBooking(data.booking));

  useEffect(() => { refresh(); }, [bookingId]);

  if (!booking) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;

  const isSender = booking.senderId === user?.id;
  const isTraveler = booking.trip?.travelerId === user?.id;
  const canPay = isSender && booking.status === 'ACCEPTED' && !booking.payment;
  const myReview = booking.reviews?.find((r: any) => r.reviewerId === user?.id);
  const canReview = booking.status === 'COMPLETED' && !myReview;
  const otherReview = booking.reviews?.find((r: any) => r.reviewerId !== user?.id);
  const reviewTarget = isSender ? booking.trip?.traveler?.name : booking.parcelRequest?.sender?.name || 'the sender';

  const handlePay = async () => {
    try {
      const { data } = await paymentApi.createIntent(bookingId);
      navigation.navigate('Payment', { clientSecret: data.clientSecret, bookingId, amount: data.amount });
    } catch {
      Alert.alert('Error', 'Could not initiate payment');
    }
  };

  const submitReview = async () => {
    if (rating < 1) return Alert.alert('Please select a rating');
    setSubmitting(true);
    try {
      await reviewApi.create({ bookingId, rating, comment });
      setReviewModal(false);
      setComment('');
      await refresh();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const statusColors: any = {
    PENDING: '#f59e0b', ACCEPTED: '#3b82f6', REJECTED: '#ef4444',
    CANCELLED: '#6b7280', COMPLETED: '#22c55e',
  };

  const latestTracking = booking.trackingEvents?.[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <View style={styles.statusRow}>
          <Text style={styles.title}>Booking Details</Text>
          <View style={[styles.badge, { backgroundColor: statusColors[booking.status] || '#6b7280' }]}>
            <Text style={styles.badgeText}>{booking.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip</Text>
        <Text style={styles.info}>✈️ {booking.trip?.originCity} → {booking.trip?.destinationCity}</Text>
        <Text style={styles.info}>🗓 {new Date(booking.trip?.departureAt).toLocaleString()}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TravelerProfile', { userId: booking.trip?.travelerId })}>
          <Text style={[styles.info, styles.link]}>
            👤 {booking.trip?.traveler?.name}  ⭐ {booking.trip?.traveler?.rating?.toFixed(1)}
            {booking.trip?.traveler?.reviewCount ? ` (${booking.trip.traveler.reviewCount} reviews)` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parcel</Text>
        <Text style={styles.info}>📦 {booking.parcelRequest?.description}</Text>
        <Text style={styles.info}>⚖️ {booking.parcelRequest?.weightKg}kg</Text>
        <Text style={styles.info}>📍 Delivery: {booking.parcelRequest?.deliveryAddress}</Text>
      </View>

      {booking.payment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <Text style={styles.info}>💰 Total: €{booking.payment.grossAmount?.toFixed(2)}</Text>
          <Text style={styles.info}>🏦 Traveler receives: €{booking.payment.travelerAmount?.toFixed(2)}</Text>
          <Text style={styles.info}>Status: {booking.payment.status}</Text>
        </View>
      )}

      {latestTracking && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Update</Text>
          <Text style={styles.info}>📍 {latestTracking.status}</Text>
          {latestTracking.note && <Text style={styles.info}>💬 {latestTracking.note}</Text>}
          <TouchableOpacity onPress={() => navigation.navigate('Tracking', { bookingId })}>
            <Text style={styles.link}>View full tracking history →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reviews section */}
      {booking.status === 'COMPLETED' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {myReview ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Your review</Text>
              <Text style={styles.stars}>{'⭐'.repeat(myReview.rating)}{'☆'.repeat(5 - myReview.rating)}</Text>
              {myReview.comment ? <Text style={styles.reviewText}>"{myReview.comment}"</Text> : null}
            </View>
          ) : null}
          {otherReview ? (
            <View style={[styles.reviewCard, { marginTop: 8 }]}>
              <Text style={styles.reviewLabel}>{otherReview.reviewer?.name}'s review of you</Text>
              <Text style={styles.stars}>{'⭐'.repeat(otherReview.rating)}{'☆'.repeat(5 - otherReview.rating)}</Text>
              {otherReview.comment ? <Text style={styles.reviewText}>"{otherReview.comment}"</Text> : null}
            </View>
          ) : null}
        </View>
      )}

      {canPay && (
        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>💳 Pay Now</Text>
        </TouchableOpacity>
      )}

      {isTraveler && booking.status === 'ACCEPTED' && (
        <TouchableOpacity style={styles.trackButton} onPress={() => navigation.navigate('Tracking', { bookingId })}>
          <Text style={styles.trackButtonText}>📍 Update Tracking</Text>
        </TouchableOpacity>
      )}

      {canReview && (
        <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewModal(true)}>
          <Text style={styles.reviewButtonText}>⭐ Rate {reviewTarget}</Text>
        </TouchableOpacity>
      )}

      {/* Review modal */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate {reviewTarget}</Text>
            <StarPicker value={rating} onChange={setRating} />
            <TextInput
              style={styles.commentInput}
              placeholder="Leave a comment (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={300}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setReviewModal(false)}>
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={submitReview} disabled={submitting}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{submitting ? 'Sending…' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52 },
  back: { color: '#2563EB', marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  section: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' },
  info: { fontSize: 14, color: '#1f2937', marginBottom: 4 },
  link: { color: '#2563EB', marginTop: 4, fontSize: 13 },
  reviewCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  stars: { fontSize: 18, marginBottom: 4 },
  reviewText: { fontSize: 13, color: '#374151', fontStyle: 'italic' },
  payButton: { backgroundColor: '#2563EB', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  trackButton: { backgroundColor: '#3b82f6', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, alignItems: 'center' },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reviewButton: { backgroundColor: '#f59e0b', margin: 16, marginTop: 8, borderRadius: 12, padding: 16, alignItems: 'center' },
  reviewButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  commentInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, height: 90, textAlignVertical: 'top' },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  submitBtn: { backgroundColor: '#f59e0b' },
});
