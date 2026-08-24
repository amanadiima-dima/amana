import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';

export default function SearchTripsScreen({ navigation }: any) {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!destination.trim() || !date.trim()) return Alert.alert('Enter destination and date');
    setLoading(true);
    try {
      navigation.navigate('TripResults', { destination: destination.trim(), date: date.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Traveler</Text>
      <Text style={styles.subtitle}>Search for travelers going to your destination</Text>

      <Text style={styles.label}>Destination city *</Text>
      <TextInput style={styles.input} placeholder="Lyon" value={destination} onChangeText={setDestination} autoFocus />

      <Text style={styles.label}>Date *</Text>
      <TextInput style={styles.input} placeholder="2024-12-25" value={date} onChangeText={setDate} />

      <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Search</Text>}
      </TouchableOpacity>

      <Text style={styles.or}>— or —</Text>

      <TouchableOpacity style={styles.createParcelBtn} onPress={() => navigation.navigate('CreateParcel')}>
        <Text style={styles.createParcelText}>📦 Create a Parcel Request first</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  or: { textAlign: 'center', color: '#9ca3af', marginVertical: 20 },
  createParcelBtn: { borderWidth: 1, borderColor: '#2563EB', borderRadius: 12, padding: 14, alignItems: 'center' },
  createParcelText: { color: '#2563EB', fontWeight: '600' },
});
