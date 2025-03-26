import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (message, ...args) => {
    if (typeof message === 'string' && message.includes('expo-notifications')) {
      return; // Ignore specific warning messages
    }
    originalWarn(message, ...args); // Continue logging other warnings
  };
}

const BusBuddy = () => {
  const [routeShortNameInput, setRouteShortNameInput] = useState('');
  const [busStops, setBusStops] = useState([]);
  const [traveledRoute, setTraveledRoute] = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [journeyActive, setJourneyActive] = useState(false);
  const [error, setError] = useState('');
  const [buses, setBuses] = useState([]);
  const [showBuses, setShowBuses] = useState(false); // State to control whether buses are shown
  const [timer, setTimer] = useState(30); // Timer state to display countdown
  const mapRef = useRef(null);

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

  // Fetch buses when "Show Buses" is clicked
  useEffect(() => {
    if (showBuses) {
      const fetchBusLocations = async () => {
        try {
          const response = await fetch('https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json', {
            headers: {
              'x-api-key': '08f58a4d3705418c89cec6ee4a6e31e0', // Add your API key here
            },
          });
          const data = await response.json();
          setBuses(data.entity || []);
        } catch (error) {
          console.error('Error fetching buses:', error);
        }
      };

      fetchBusLocations();
      const interval = setInterval(fetchBusLocations, 30000); // Refresh every 30 seconds

      // Timer to show countdown for refresh
      const timerInterval = setInterval(() => {
        setTimer(prev => {
          if (prev === 1) {
            return 30; // Reset timer after it hits 0
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(timerInterval);
      };
    }
  }, [showBuses]);

  const handleBusClick = (bus) => {
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={routeShortNameInput}
        onChangeText={setRouteShortNameInput}
        placeholder="Enter Route Number"
        style={styles.input}
      />
      <Button title="Load Route" onPress={loadRouteData} />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Show Buses / Hide Buses button */}
      <Button title={showBuses ? 'Hide Buses' : 'Show Buses'} onPress={() => setShowBuses(!showBuses)} />

      {showBuses && <Text style={styles.timer}>Refreshing in {timer} seconds</Text>}

      <MapView ref={mapRef} style={styles.map}>
        {remainingRoute.length > 0 && (
          <Polyline 
            coordinates={remainingRoute.map(stop => ({
              latitude: stop.shape_pt_lat,
              longitude: stop.shape_pt_lon,
            }))} 
            strokeWidth={3} 
            strokeColor="yellow" 
          />
        )}

        {busStops.map((stop, index) => (
          <Marker 
            key={`stop-${index}`} 
            coordinate={{ latitude: stop.shape_pt_lat, longitude: stop.shape_pt_lon }} 
            pinColor="blue"
            title={`Stop ${index + 1}`}
          />
        ))}

        {showBuses && buses.map((bus, index) => (
          <Marker 
            key={`bus-${index}`} 
            coordinate={{ latitude: bus.vehicle.position.latitude, longitude: bus.vehicle.position.longitude }} 
            pinColor="red"
            title={`Bus ${bus.vehicle.trip.trip_id}`}
            onPress={() => handleBusClick(bus)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, margin: 10, paddingHorizontal: 10 },
  error: { color: 'red', margin: 10 },
  map: { flex: 1, marginTop: 10 },
  timer: { textAlign: 'center', fontSize: 18, color: 'blue', marginTop: 10 },
});

export default BusBuddy;
