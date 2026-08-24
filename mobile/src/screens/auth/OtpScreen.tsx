import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function OtpScreen({ navigation, route }: any) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'otp' | 'name'>('otp');
  const { verifyOtp } = useAuthStore();

  const handleVerify = async () => {
    if (code.length !== 6) return Alert.alert('Enter the 6-digit code');
    setLoading(true);
    try {
      // Check if new user needs name
      setStep('name');
    } catch {
      Alert.alert('Error', 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) return Alert.alert('Enter your name');
    setLoading(true);
    try {
      await verifyOtp(phone, code, name.trim());
      // Navigation handled automatically by AppNavigator once isAuthenticated is true
    } catch {
      Alert.alert('Error', 'Verification failed. Please try again.');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>📦 Amana</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={handleComplete} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Started</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>📦 Amana</Text>
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>Code sent to {phone}</Text>
      <TextInput
        style={[styles.input, styles.otpInput]}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Change number</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 16,
  },
  otpInput: { textAlign: 'center', fontSize: 28, letterSpacing: 12, fontWeight: '700' },
  button: {
    backgroundColor: '#2563EB', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#2563EB', fontSize: 14 },
});
