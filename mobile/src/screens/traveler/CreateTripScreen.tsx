import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { tripApi } from '../../api';

export default function CreateTripScreen({ navigation }: any) {
  const [form, setForm] = useState({
    originCity: '', destinationCity: '', originAddress: '',
    departureAt: '', maxWeightKg: '', pricePerKg: '', notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.originCity || !form.destinationCity || !form.departureAt || !form.maxWeightKg || !form.pricePerKg) {
      return Alert.alert('Fill in all required fields');
    }
    setLoading(true);
    try {
      await tripApi.create({
        ...form,
        maxWeightKg: parseFloat(form.maxWeightKg),
        pricePerKg: parseFloat(form.pricePerKg),
      });
      Alert.alert('Trip created!', '', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Error', 'Could not create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Trip</Text>

      <Text style={styles.label}>From *</Text>
      <TextInput style={styles.input} placeholder="Paris" value={form.originCity} onChangeText={(v) => set('originCity', v)} />

      <Text style={styles.label}>To *</Text>
      <TextInput style={styles.input} placeholder="Lyon" value={form.destinationCity} onChangeText={(v) => set('destinationCity', v)} />

      <Text style={styles.label}>Pickup address (optional)</Text>
      <TextInput style={styles.input} placeholder="Exact address" value={form.originAddress} onChangeText={(v) => set('originAddress', v)} />

      <Text style={styles.label}>Departure date & time *</Text>
      <TextInput style={styles.input} placeholder="2024-12-25T14:00:00" value={form.departureAt} onChangeText={(v) => set('departureAt', v)} />

      <Text style={styles.label}>Max weight (kg) *</Text>
      <TextInput style={styles.input} placeholder="10" keyboardType="decimal-pad" value={form.maxWeightKg} onChangeText={(v) => set('maxWeightKg', v)} />

      <Text style={styles.label}>Price per kg (€) *</Text>
      <TextInput style={styles.input} placeholder="2.50" keyboardType="decimal-pad" value={form.pricePerKg} onChangeText={(v) => set('pricePerKg', v)} />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="Any restrictions? Fragile items only, no liquids, etc." value={form.notes} onChangeText={(v) => set('notes', v)} multiline numberOfLines={3} />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Trip</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 52 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb' },
  textarea: { height: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
