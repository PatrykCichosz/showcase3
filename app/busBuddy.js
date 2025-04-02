import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import * as Notifications from 'expo-notifications';

const BusBuddy = () => {
  const [routeShortNameInput, setRouteShortNameInput] = useState('');
  const [busStops, setBusStops] = useState([]);
  const [traveledRoute, setTraveledRoute] = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [journeyActive, setJourneyActive] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  let journeyInterval = useRef(null);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Notification permissions not granted');
      }
    };
    requestPermissions();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const loadRouteData = async () => {
    if (!routeShortNameInput) {
      setError('Please enter a route number');
      return;
    }

    try {
      const routesResponse = await fetch('https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/routes.json');
      const routesData = await routesResponse.json();
      const route = routesData.find(route => route.route_short_name.toString() === routeShortNameInput);

      if (!route) {
        setError('Route not found');
        return;
      }

      const routeId = route.route_id;
      const tripsResponse = await fetch('https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/trips.json');
      const tripsData = await tripsResponse.json();
      const trip = tripsData.find(trip => trip.route_id === routeId);

      if (!trip) {
        setError('No trips found for this route');
        return;
      }

      const shapeId = trip.shape_id;
      const shapeResponse = await fetch(`https://raw.githubusercontent.com/PatrykCichosz/proj_json/main/${shapeId}.json`);
      const shapeData = await shapeResponse.json();

      if (!shapeData.length) {
        setError('No route data found');
        return;
      }

      setBusStops(shapeData);
      setRemainingRoute(shapeData);
      setTraveledRoute([]);
      setJourneyActive(false);

      mapRef.current?.animateToRegion({
        latitude: shapeData[0].shape_pt_lat,
        longitude: shapeData[0].shape_pt_lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Error loading the route.');
    }
  };

  const startJourney = () => {
    if (remainingRoute.length === 0) return;
    setJourneyActive(true);
    journeyInterval.current = setInterval(() => {
      setRemainingRoute(prev => {
        if (prev.length <= 1) {
          clearInterval(journeyInterval.current);
          setJourneyActive(false);
          return [];
        }
        setTraveledRoute(trav => [...trav, prev[0]]);
        return prev.slice(1);
      });
    }, 1500);

  const stopJourney = () => {
    clearInterval(journeyInterval.current);
    setJourneyActive(false);
    setTraveledRoute([]);
    setRemainingRoute(busStops);
    mapRef.current?.animateToRegion({
      latitude: busStops[0].shape_pt_lat,
      longitude: busStops[0].shape_pt_lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);
  };

  const notifyTwoStopsAway = async () => {
    if (remainingRoute.length < 3) return;

    const destination = remainingRoute[remainingRoute.length - 3];

    setTraveledRoute(prev => [...prev, ...remainingRoute.slice(0, -3)]);
    setRemainingRoute(remainingRoute.slice(-3));

    mapRef.current?.animateToRegion({
      latitude: destination.shape_pt_lat,
      longitude: destination.shape_pt_lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Bus Buddy",
          body: "You are two stops away from your destination!",
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, 
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={routeShortNameInput}
        onChangeText={setRouteShortNameInput}
        placeholder="Enter Route Number"
        placeholderTextColor="#ccc"
        style={styles.input}
      />
      <Button title="Load Route" onPress={loadRouteData} color="#3654eb" />
      <Button title="Start Journey" onPress={startJourney} disabled={journeyActive} color="#f7eb05" />
      <Button title="Stop Journey" onPress={stopJourney} disabled={!journeyActive} color="#ff5722" />
      <Button title="Notify Two Stops Away" onPress={notifyTwoStopsAway} disabled={!journeyActive} color="#00bcd4" />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <MapView ref={mapRef} style={styles.map}>
        {traveledRoute.length > 0 && (
          <Polyline coordinates={traveledRoute.map(stop => ({ latitude: stop.shape_pt_lat, longitude: stop.shape_pt_lon }))} strokeWidth={5} strokeColor="#3654eb" />
        )}
        {remainingRoute.length > 0 && (
          <Polyline coordinates={remainingRoute.map(stop => ({ latitude: stop.shape_pt_lat, longitude: stop.shape_pt_lon }))} strokeWidth={5} strokeColor="#f7eb05" />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 15,
  },
  input: {
    height: 45,
    borderColor: '#01dac3',
    borderWidth: 1,
    borderRadius: 25,
    margin: 10,
    paddingLeft: 15,
    color: '#fff',
    fontSize: 16,
  },
  map: {
    flex: 1,
    marginTop: 20,
    borderRadius: 10,
  },
  errorText: {
    color: '#ff1744',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default BusBuddy;
