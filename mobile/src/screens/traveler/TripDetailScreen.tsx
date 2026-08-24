import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { bookingApi } from '../../api';

export default function TripDetailScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  React.useEffect(() => {
    loadTrip();
    loadBookings();
  }, []);

  const loadTrip = async () => {
    const { data } = await (await import('../../api')).tripApi.getById(tripId);
    setTrip(data.trip);
  };

  const loadBookings = async () => {
    const { data } = await bookingApi.getAll('traveler');
    setBookings(data.bookings.filter((b: any) => b.trip?.id === tripId || true));
  };

  const respond = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await bookingApi.respond(bookingId, action);
      Alert.alert('Done!');
      loadBookings();
    } catch {
      Alert.alert('Error', 'Could not update booking');
    }
  };

  if (!trip) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>{trip.originCity} → {trip.destinationCity}</Text>
        <Text style={styles.meta}>🗓 {new Date(trip.departureAt).toLocaleString()}</Text>
        <Text style={styles.meta}>⚖️ {trip.maxWeightKg}kg available · €{trip.pricePerKg}/kg</Text>
      </View>

      <Text style={styles.sectionTitle}>Parcel Requests</Text>
      {bookings.length === 0 && <Text style={styles.empty}>No requests yet</Text>}
      {bookings.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.cardTitle}>{b.parcelRequest?.description}</Text>
          <Text style={styles.cardMeta}>⚖️ {b.parcelRequest?.weightKg}kg</Text>
          <Text style={styles.cardMeta}>📍 {b.parcelRequest?.deliveryAddress}</Text>
          {b.status === 'PENDING' && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => respond(b.id, 'accept')}>
                <Text style={styles.btnText}>✓ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => respond(b.id, 'reject')}>
                <Text style={styles.btnText}>✗ Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {b.status !== 'PENDING' && (
            <Text style={[styles.status, { color: b.status === 'ACCEPTED' ? '#22c55e' : '#ef4444' }]}>{b.status}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52 },
  back: { color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta: { color: '#6b7280', fontSize: 14, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', padding: 16, paddingBottom: 8 },
  card: { backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12, padding: 14, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  cardMeta: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 8, padding: 10, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  status: { marginTop: 8, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});
