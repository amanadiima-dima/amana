import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { reviewApi } from '../../api';

function StarBar({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <Text style={{ fontSize: 16 }}>
      {'⭐'.repeat(full)}{'☆'.repeat(5 - full)}
    </Text>
  );
}

export default function TravelerProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    reviewApi.getPublicProfile(userId).then(({ data }) => setProfile(data.user));
  }, [userId]);

  if (!profile) return <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <View style={styles.avatarRow}>
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{profile.name?.[0]}</Text></View>
          )}
          <View>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.isVerified && <Text style={styles.verified}>✓ Verified</Text>}
            <View style={styles.ratingRow}>
              <StarBar rating={profile.rating} />
              <Text style={styles.ratingText}>
                {' '}{profile.rating?.toFixed(1)} · {profile.reviewCount} review{profile.reviewCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.member}>Member since {new Date(profile.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews ({profile.reviewsReceived?.length ?? 0})</Text>
        {profile.reviewsReceived?.length === 0 && (
          <Text style={styles.empty}>No reviews yet.</Text>
        )}
        {profile.reviewsReceived?.map((r: any) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewerName}>{r.reviewer?.name}</Text>
              <Text style={{ fontSize: 14 }}>{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
            </View>
            {r.booking?.trip && (
              <Text style={styles.reviewTrip}>
                {r.booking.trip.originCity} → {r.booking.trip.destinationCity} · {new Date(r.booking.trip.departureAt).toLocaleDateString()}
              </Text>
            )}
            {r.comment && <Text style={styles.reviewComment}>"{r.comment}"</Text>}
            <Text style={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 52 },
  back: { color: '#2563EB', marginBottom: 16 },
  avatarRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  verified: { color: '#22c55e', fontWeight: '600', fontSize: 13, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#6b7280' },
  member: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  bio: { color: '#374151', fontSize: 14, marginTop: 4 },
  section: { margin: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 12 },
  empty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontWeight: '700', fontSize: 14, color: '#1f2937' },
  reviewTrip: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  reviewComment: { fontSize: 13, color: '#374151', fontStyle: 'italic', marginBottom: 4 },
  reviewDate: { fontSize: 11, color: '#9ca3af' },
});
