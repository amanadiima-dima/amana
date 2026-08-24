import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { notificationApi } from '../../api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await notificationApi.getAll();
    setNotifications(data.notifications);
  };

  const markRead = async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, !item.read && styles.unread]} onPress={() => markRead(item.id)}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemBody}>{item.body}</Text>
            <Text style={styles.itemTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', padding: 16, paddingTop: 52, backgroundColor: '#fff' },
  item: { backgroundColor: '#fff', margin: 8, marginBottom: 0, borderRadius: 10, padding: 14 },
  unread: { borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  itemTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  itemBody: { color: '#4b5563', fontSize: 13, marginBottom: 4 },
  itemTime: { color: '#9ca3af', fontSize: 11 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
});
