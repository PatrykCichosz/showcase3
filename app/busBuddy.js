import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';

const BusBuddy = () => {
  const [routeShortNameInput, setRouteShortNameInput] = useState('');
  const [busStops, setBusStops] = useState([]);
  const [traveledRoute, setTraveledRoute] = useState([]);
  const [remainingRoute, setRemainingRoute] = useState([]);
  const [journeyActive, setJourneyActive] = useState(false);
  const [error, setError] = useState('');
  const [routeLine, setRouteLine] = useState([]); // Track each polyline segment color
  const [journeyProgress, setJourneyProgress] = useState(0); // Track progress
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
      setRouteLine(shapeData.map(stop => ({ ...stop, color: 'yellow' }))); // Initialize with yellow color
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
    if (busStops.length === 0) {
      setError('Load a route first');
      return;
    }

    setJourneyActive(true);
    setTraveledRoute([{ 
      latitude: busStops[0].shape_pt_lat, 
      longitude: busStops[0].shape_pt_lon 
    }]);

    setRemainingRoute(busStops);
    animateJourney(0); // Start from the first bus stop
  };

  const animateJourney = (index) => {
    if (!journeyActive || index >= busStops.length) return;

    const newProgress = (index + 1) / busStops.length;
    setJourneyProgress(newProgress); // Update the journey progress

    // Gradually update the routeLine color
    setRouteLine((prevLine) => {
      return prevLine.map((stop, i) => {
        // Change color to blue for every bus stop passed
        return { ...stop, color: i <= index ? 'blue' : 'yellow' };
      });
    });

    setTraveledRoute(prev => [
      ...prev, 
      { latitude: busStops[index].shape_pt_lat, longitude: busStops[index].shape_pt_lon }
    ]);

    mapRef.current?.animateToRegion({
      latitude: busStops[index].shape_pt_lat,
      longitude: busStops[index].shape_pt_lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 1000);

    setTimeout(() => {
      if (journeyActive) {
        animateJourney(index + 1); // Continue the journey
      }
    }, 1000); // Adjust the timeout for speed of the journey
  };

  const endJourney = () => {
    setJourneyActive(false);
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
      {busStops.length > 0 && !journeyActive && <Button title="Start Journey" onPress={startJourney} />}
      {journeyActive && <Button title="End Journey" onPress={endJourney} color="red" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

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

        {traveledRoute.length > 0 && (
          <Polyline 
            coordinates={traveledRoute} 
            strokeWidth={5} 
            strokeColor="blue" 
          />
        )}

        {routeLine.map((stop, index) => (
          <Polyline 
            key={index} 
            coordinates={[{ latitude: stop.shape_pt_lat, longitude: stop.shape_pt_lon }]} 
            strokeWidth={5} 
            strokeColor={stop.color} 
          />
        ))}

        {busStops.map((stop, index) => (
          <Marker key={index} coordinate={{ latitude: stop.shape_pt_lat, longitude: stop.shape_pt_lon }} />
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
});

export default BusBuddy;
