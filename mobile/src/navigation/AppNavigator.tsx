import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { syncPushToken } from '../utils/notifications';

// Auth screens
import PhoneScreen from '../screens/auth/PhoneScreen';
import OtpScreen from '../screens/auth/OtpScreen';

// Shared screens
import BookingDetailScreen from '../screens/shared/BookingDetailScreen';
import TrackingScreen from '../screens/shared/TrackingScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import TravelerProfileScreen from '../screens/shared/TravelerProfileScreen';

// Traveler screens
import TravelerHomeScreen from '../screens/traveler/TravelerHomeScreen';
import CreateTripScreen from '../screens/traveler/CreateTripScreen';
import TripDetailScreen from '../screens/traveler/TripDetailScreen';

// Sender screens
import SenderHomeScreen from '../screens/sender/SenderHomeScreen';
import SearchTripsScreen from '../screens/sender/SearchTripsScreen';
import CreateParcelScreen from '../screens/sender/CreateParcelScreen';
import TripResultsScreen from '../screens/sender/TripResultsScreen';
import PaymentScreen from '../screens/sender/PaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen
      name="Send"
      component={SenderHomeScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} /> }}
    />
    <Tab.Screen
      name="Travel"
      component={TravelerHomeScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="airplane-outline" color={color} size={size} /> }}
    />
    <Tab.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
    />
  </Tab.Navigator>
);

export default function AppNavigator() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const navigationRef = useRef<any>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => { loadUser(); }, []);

  // Sync push token and set up listeners once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    syncPushToken();

    // Handle notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Badge / in-app alert handled by setNotificationHandler
    });

    // Handle tap on notification — navigate to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.bookingId && navigationRef.current) {
        navigationRef.current.navigate('BookingDetail', { bookingId: data.bookingId });
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Phone" component={PhoneScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
            <Stack.Screen name="SearchTrips" component={SearchTripsScreen} />
            <Stack.Screen name="TripResults" component={TripResultsScreen} />
            <Stack.Screen name="CreateParcel" component={CreateParcelScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="TravelerProfile" component={TravelerProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
