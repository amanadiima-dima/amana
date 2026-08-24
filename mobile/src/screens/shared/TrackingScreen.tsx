import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trackingApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const STATUSES = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

export default function TrackingScreen({ route }: any) {
  const { bookingId } = route.params;
  const { user } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTraveler, setIsTraveler] = useState(false);

  useEffect(() => {
    trackingApi.getHistory(bookingId).then(({ data }) => setEvents(data.events));
  }, [bookingId]);

  const addEvent = async (status: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('status', status);

      if (status === 'DELIVERED') {
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) {
          formData.append('photo', {
            uri: result.assets[0].uri, name: 'delivery.jpg', type: 'image/jpeg',
          } as any);
        }
      }

      const { data } = await trackingApi.addEvent(bookingId, formData);
      setEvents((prev) => [data.event, ...prev]);
      if (status === 'DELIVERED') Alert.alert('🎉 Delivered!', 'Payment will be released to you.');
    } catch {
      Alert.alert('Error', 'Could not update tracking');
    } finally {
      setLoading(false);
    }
  };

  const statusIcon: any = {
    PICKED_UP: '📦', IN_TRANSIT: '🚗', DELIVERED: '✅', FAILED: '❌', PENDING: '⏳', ACCEPTED: '✓',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Tracking</Text>

      {isTraveler && (
        <View style={styles.actions}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} style={styles.actionBtn} onPress={() => addEvent(s)} disabled={loading}>
              <Text style={styles.actionBtnText}>{statusIcon[s]} {s.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && <ActivityIndicator color="#2563EB" style={{ marginVertical: 12 }} />}

      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>No tracking events yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.event}>
            <Text style={styles.eventIcon}>{statusIcon[item.status] || '•'}</Text>
            <View style={styles.eventBody}>
              <Text style={styles.eventStatus}>{item.status.replace('_', ' ')}</Text>
              {item.note && <Text style={styles.eventNote}>{item.note}</Text>}
              <Text style={styles.eventTime}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 52 },
  title: { fontSize: 20, fontWeight: '700', padding: 16 },
  actions: { padding: 12, gap: 8 },
  actionBtn: { backgroundColor: '#2563EB', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600' },
  event: { flexDirection: 'row', backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 10, padding: 12 },
  eventIcon: { fontSize: 24, marginRight: 12 },
  eventBody: { flex: 1 },
  eventStatus: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  eventNote: { color: '#6b7280', fontSize: 13, marginBottom: 2 },
  eventTime: { color: '#9ca3af', fontSize: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
