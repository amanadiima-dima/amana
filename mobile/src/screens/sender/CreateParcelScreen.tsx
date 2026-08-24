import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { parcelApi, bookingApi } from '../../api';

export default function CreateParcelScreen({ route, navigation }: any) {
  const preSelectedTrip = route.params?.preSelectedTrip;
  const [form, setForm] = useState({ pickupAddress: '', deliveryAddress: '', weightKg: '', description: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.7 });
    if (!result.canceled) setPhotos(result.assets.map((a) => a.uri));
  };

  const handleSubmit = async () => {
    if (!form.pickupAddress || !form.deliveryAddress || !form.weightKg || !form.description) {
      return Alert.alert('Fill in all required fields');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      photos.forEach((uri, i) => {
        formData.append('photos', { uri, name: `photo_${i}.jpg`, type: 'image/jpeg' } as any);
      });

      const { data } = await parcelApi.create(formData);
      const parcelId = data.parcel.id;

      if (preSelectedTrip) {
        // Auto-book with the pre-selected trip
        await bookingApi.create(preSelectedTrip.id, parcelId);
        Alert.alert('Booking Request Sent!', 'The traveler will be notified.', [
          { text: 'OK', onPress: () => navigation.navigate('Send') },
        ]);
      } else {
        Alert.alert('Parcel Created!', 'Now search for a traveler.', [
          { text: 'Find Traveler', onPress: () => navigation.navigate('SearchTrips') },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Could not create parcel request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Parcel Details</Text>
      {preSelectedTrip && (
        <View style={styles.tripBanner}>
          <Text style={styles.tripBannerText}>✈️ Traveler: {preSelectedTrip.traveler?.name} → {preSelectedTrip.destinationCity}</Text>
        </View>
      )}

      <Text style={styles.label}>Pickup address *</Text>
      <TextInput style={styles.input} placeholder="Where should the traveler pick it up?" value={form.pickupAddress} onChangeText={(v) => set('pickupAddress', v)} />

      <Text style={styles.label}>Delivery address *</Text>
      <TextInput style={styles.input} placeholder="Where should it be delivered?" value={form.deliveryAddress} onChangeText={(v) => set('deliveryAddress', v)} />

      <Text style={styles.label}>Weight (kg) *</Text>
      <TextInput style={styles.input} placeholder="2.5" keyboardType="decimal-pad" value={form.weightKg} onChangeText={(v) => set('weightKg', v)} />

      {preSelectedTrip && form.weightKg && (
        <View style={styles.pricePreview}>
          <Text style={styles.pricePreviewText}>
            💰 Estimated cost: €{(parseFloat(form.weightKg || '0') * preSelectedTrip.pricePerKg * 1.10).toFixed(2)}
            {' '}(incl. 10% fee)
          </Text>
        </View>
      )}

      <Text style={styles.label}>Description *</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="What's in the parcel? (e.g. Books, clothes, electronics)" value={form.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={3} />

      <TouchableOpacity style={styles.photoBtn} onPress={pickPhotos}>
        <Text style={styles.photoBtnText}>📷 Add Photos ({photos.length}/5)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{preSelectedTrip ? 'Send Booking Request' : 'Create Parcel'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  tripBanner: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginBottom: 20 },
  tripBannerText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' },
  textarea: { height: 80, textAlignVertical: 'top' },
  pricePreview: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginBottom: 16 },
  pricePreviewText: { color: '#166534', fontWeight: '600', fontSize: 13 },
  photoBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  photoBtnText: { color: '#374151', fontWeight: '500' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
