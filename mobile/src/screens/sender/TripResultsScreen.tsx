import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { tripApi } from '../../api';

export default function TripResultsScreen({ route, navigation }: any) {
  const { destination, date } = route.params;
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripApi.search(destination, date)
      .then(({ data }) => setTrips(data.trips))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Travelers to {destination}</Text>
        <Text style={styles.subtitle}>{date} · {trips.length} result(s)</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<Text style={styles.empty}>No travelers found for this route and date.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CreateParcel', { preSelectedTrip: item })}
          >
            <View style={styles.cardTop}>
              <TouchableOpacity onPress={() => navigation.navigate('TravelerProfile', { userId: item.travelerId })}>
                <Text style={styles.travelerName}>{item.traveler?.name}</Text>
                <View style={styles.stars}>
                  <Text style={styles.rating}>
                    ⭐ {item.traveler?.rating ? item.traveler.rating.toFixed(1) : 'New'}
                    {item.traveler?.reviewCount ? ` · ${item.traveler.reviewCount} review${item.traveler.reviewCount > 1 ? 's' : ''}` : ''}
                  </Text>
                  {item.traveler?.isVerified && <Text style={styles.verified}>✓ Verified</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.priceBox}>
                <Text style={styles.price}>€{item.pricePerKg}</Text>
                <Text style={styles.priceUnit}>/kg</Text>
              </View>
            </View>
            <Text style={styles.meta}>⚖️ Up to {item.maxWeightKg}kg · 🗓 {new Date(item.departureAt).toLocaleString()}</Text>
            {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52 },
  back: { color: '#2563EB', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6b7280', fontSize: 13 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  travelerName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  stars: { flexDirection: 'row', gap: 8 },
  rating: { fontSize: 13, color: '#6b7280' },
  verified: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  priceBox: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: 22, fontWeight: '800', color: '#2563EB' },
  priceUnit: { fontSize: 13, color: '#6b7280', marginLeft: 2 },
  meta: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  notes: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, paddingHorizontal: 32 },
});
