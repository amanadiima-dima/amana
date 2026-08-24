import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleUploadId = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: false, quality: 0.8 });
    if (result.canceled) return;
    Alert.alert('Upload ID', 'Please select front and back of your ID separately. Feature in progress.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {user?.rating?.toFixed(1) || '—'}</Text>
          {user?.isVerified
            ? <Text style={styles.verified}>✓ ID Verified</Text>
            : <Text style={styles.unverified}>⚠️ Not Verified</Text>}
        </View>
      </View>

      {!user?.isVerified && (
        <TouchableOpacity style={styles.verifyBanner} onPress={handleUploadId}>
          <Text style={styles.verifyBannerText}>🪪 Verify your ID to post trips and parcels →</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Send')}>
          <Text style={styles.menuItemText}>📦 My Parcels</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Travel')}>
          <Text style={styles.menuItemText}>✈️ My Trips</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#fff', alignItems: 'center', padding: 28, paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  phone: { color: '#6b7280', marginBottom: 10 },
  ratingRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  rating: { fontSize: 15 },
  verified: { color: '#22c55e', fontWeight: '600', fontSize: 13 },
  unverified: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  verifyBanner: { backgroundColor: '#fffbeb', margin: 12, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  verifyBannerText: { color: '#92400e', fontWeight: '600' },
  section: { backgroundColor: '#fff', margin: 12, borderRadius: 12, overflow: 'hidden' },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemText: { fontSize: 15, color: '#1f2937' },
  logoutBtn: { margin: 16, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
