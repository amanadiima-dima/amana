import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

function PaymentForm({ clientSecret, bookingId, amount, navigation }: any) {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment failed', error.message);
      } else if (paymentIntent?.status === 'Succeeded') {
        Alert.alert('Payment successful! 🎉', 'Your parcel is now booked. The traveler will be notified.', [
          { text: 'OK', onPress: () => navigation.navigate('BookingDetail', { bookingId }) },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Payment</Text>
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Total to pay</Text>
        <Text style={styles.amount}>€{amount?.toFixed(2)}</Text>
        <Text style={styles.amountNote}>Includes 10% platform fee · Held in escrow until delivery</Text>
      </View>

      <View style={styles.escrowInfo}>
        <Text style={styles.escrowTitle}>🔒 Secure Escrow Payment</Text>
        <Text style={styles.escrowText}>Your money is held safely and only released to the traveler once your parcel is delivered.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePay} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pay €{amount?.toFixed(2)}</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function PaymentScreen({ route, navigation }: any) {
  const { clientSecret, bookingId, amount } = route.params;

  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}>
      <PaymentForm clientSecret={clientSecret} bookingId={bookingId} amount={amount} navigation={navigation} />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 28 },
  amountBox: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  amountLabel: { color: '#6b7280', fontSize: 13, marginBottom: 4 },
  amount: { fontSize: 40, fontWeight: '800', color: '#2563EB', marginBottom: 6 },
  amountNote: { color: '#6b7280', fontSize: 12, textAlign: 'center' },
  escrowInfo: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 24 },
  escrowTitle: { fontWeight: '700', marginBottom: 6, color: '#166534' },
  escrowText: { color: '#166534', fontSize: 13, lineHeight: 18 },
  button: { backgroundColor: '#2563EB', borderRadius: 14, padding: 18, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
