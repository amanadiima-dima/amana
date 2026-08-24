import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { parcelApi, bookingApi } from '../../api';

export default function SenderHomeScreen({ navigation }: any) {
  const [parcels, setParcels] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await parcelApi.getMyParcels();
    setParcels(data.parcels);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const statusColor = (s: string) =>
    ({ PENDING: '#f59e0b', ACCEPTED: '#3b82f6', COMPLETED: '#22c55e', CANCELLED: '#ef4444' }[s] || '#6b7280');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Parcels</Text>
        <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('SearchTrips')}>
          <Text style={styles.searchBtnText}>🔍 Find a Traveler</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={parcels}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No parcels yet. Find a traveler to get started!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => item.booking && navigation.navigate('BookingDetail', { bookingId: item.booking.id })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
              {item.booking && (
                <View style={[styles.badge, { backgroundColor: statusColor(item.booking.status) }]}>
                  <Text style={styles.badgeText}>{item.booking.status}</Text>
                </View>
              )}
              {!item.booking && (
                <View style={[styles.badge, { backgroundColor: '#9ca3af' }]}>
                  <Text style={styles.badgeText}>NO BOOKING</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>⚖️ {item.weightKg}kg · 📍 {item.deliveryAddress}</Text>
            {item.booking?.trip && (
              <Text style={styles.meta}>✈️ {item.booking.trip.destinationCity} · {new Date(item.booking.trip.departureAt).toLocaleDateString()}</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, paddingTop: 52, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  searchBtn: { backgroundColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  description: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  meta: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15, paddingHorizontal: 32 },
});
