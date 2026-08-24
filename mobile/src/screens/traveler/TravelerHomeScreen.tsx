import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { tripApi } from '../../api';

export default function TravelerHomeScreen({ navigation }: any) {
  const [trips, setTrips] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await tripApi.getMyTrips();
      setTrips(data.trips);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const statusColor = (s: string) =>
    ({ OPEN: '#22c55e', FULL: '#f59e0b', IN_PROGRESS: '#3b82f6', COMPLETED: '#6b7280', CANCELLED: '#ef4444' }[s] || '#6b7280');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateTrip')}>
          <Text style={styles.addButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No trips yet. Create your first trip!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}>
            <View style={styles.cardTop}>
              <Text style={styles.route}>{item.originCity} → {item.destinationCity}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              🗓 {new Date(item.departureAt).toLocaleDateString()}  ·  ⚖️ {item.maxWeightKg}kg  ·  €{item.pricePerKg}/kg
            </Text>
            <Text style={styles.bookings}>{item._count?.bookings || 0} booking(s)</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 52, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700' },
  addButton: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  route: { fontSize: 16, fontWeight: '700' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  meta: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  bookings: { color: '#2563EB', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
});
