import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as Notifications from 'expo-notifications';

const BusBuddy = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBus, setSelectedBus] = useState('');
  const [buses, setBuses] = useState([
    { id: 'bus1', name: '13 Bus Route' },
    { id: 'bus2', name: '151 Bus Route' },
    { id: 'bus3', name: '68 Bus Route' },
  ]);
  const [busRoute, setBusRoute] = useState(null);
  const [travelledRoute, setTravelledRoute] = useState([]);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [endRoute, setEndRoute] = useState(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [initialLocation, setInitialLocation] = useState(null);
  const [journeyInterval, setJourneyInterval] = useState(null);
  const [journeyFinished, setJourneyFinished] = useState(false);

  const OPENROUTESERVICE_API_KEY = '5b3ce3597851110001cf6248486d78cf19034405ac0d812759879eec'; 

  useEffect(() => {
    requestLocationPermission();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  const requestLocationPermission = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission is required to use the map.');
        setLoading(false);
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setInitialLocation({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    } catch (error) {
      setErrorMessage('Could not fetch location.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusChange = (busId) => {
    setSelectedBus(busId);
    fetchBusRoute(busId);
  };

  const fetchBusRoute = async (busId) => {
    let startCoord = location ? [location.longitude, location.latitude] : [-6.26031, 53.349805];
    let endCoord = [-6.248, 53.357]; 
    switch (busId) {
      case 'bus1':
        endCoord = [-6.243, 53.343];
        break;
      case 'bus2':
        endCoord = [-6.244, 53.349];
        break;
      case 'bus3':
        endCoord = [-6.262, 53.360];
        break;
      default:
        endCoord = [-6.248, 53.357]; 
    }
    const routeData = await getRouteFromOpenRouteService(startCoord, endCoord);
    setBusRoute(routeData);
    setEndRoute(endCoord);
  };

  const getRouteFromOpenRouteService = async (start, end) => {
    try {
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTESERVICE_API_KEY}&start=${start.join(',')}&end=${end.join(',')}`
      );
      if (response.data.features && response.data.features.length > 0) {
        const geometry = response.data.features[0].geometry;
        if (geometry && geometry.type === 'LineString') {
          return geometry.coordinates.map((coord) => ({
            latitude: coord[1], 
            longitude: coord[0], 
          }));
        } else {
          return [];
        }
      } else {
        return [];
      }
    } catch (error) {
      setErrorMessage('Failed to fetch route data.');
      return [];
    }
  };

  const startJourney = () => {
    if (busRoute) {
      setJourneyStarted(true);
      setTravelledRoute([location]);
      setProgressIndex(0);
      simulateProgress();
    }
  };

  const simulateProgress = () => {
    if (!journeyStarted || progressIndex >= busRoute.length - 1) return;
    const interval = setInterval(() => {
      setProgressIndex((prevIndex) => {
        if (prevIndex < busRoute.length - 1) {
          setTravelledRoute((prevRoute) => [
            ...prevRoute,
            busRoute[prevIndex + 1],
          ]);
          setLocation({
            latitude: busRoute[prevIndex + 1].latitude,
            longitude: busRoute[prevIndex + 1].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          return prevIndex + 1;
        } else {
          clearInterval(interval);
          return prevIndex;
        }
      });
    }, 1000);
    setJourneyInterval(interval);
  };

  const stopJourney = () => {
    setJourneyStarted(false);
    setProgressIndex(0);
    setTravelledRoute([]);
    clearInterval(journeyInterval);
    setLocation({
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const endJourney = async () => {
    if (journeyFinished) return;
    clearInterval(journeyInterval);
    setJourneyStarted(false);
    setProgressIndex(0);
    setTravelledRoute([]);
    await sendJourneyNotification();
    setJourneyFinished(true);
    setLocation({
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const sendJourneyNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Journey Ended',
        body: 'You are about to arrive at your destination.',
      },
      trigger: { seconds: 2 },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <Text style={styles.title}>Bus Buddy</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedBus}
            onValueChange={handleBusChange}
            style={styles.picker}
          >
            <Picker.Item label="Select Bus" value="" />
            {buses.map((bus) => (
              <Picker.Item key={bus.id} label={bus.name} value={bus.id} />
            ))}
          </Picker>
        </View>
        <View style={styles.mapContainer}>
          {location && (
            <MapView
              style={styles.map}
              initialRegion={location}
              region={location}
              showsUserLocation={false}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="You are here"
                pinColor="blue"
              />
              {busRoute && (
                <Polyline
                  coordinates={busRoute}
                  strokeColor="#FFD700"
                  strokeWidth={5}
                />
              )}
              {travelledRoute && (
                <Polyline
                  coordinates={travelledRoute}
                  strokeColor="blue"
                  strokeWidth={5}
                />
              )}
            </MapView>
          )}
        </View>
        <View style={styles.buttons}>
          <Button title="Start Journey" onPress={startJourney} color="#FFD700" />
          <Button title="Stop Journey" onPress={stopJourney} color="#FF0000" />
          <Button title="End Journey" onPress={endJourney} color="#FF4500" />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const darkMapStyle = [];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFD700',
    marginBottom: 10,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 20,
  },
  picker: {
    height: 120,
    width: '100%',
    backgroundColor: '#0',
    color: '#FFD700',
  },
  mapContainer: {
    width: '100%',
    flex: 0.8,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 40,
  },
});

export default BusBuddy;
