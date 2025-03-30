import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import axios from 'axios';

const WeatherApp = () => {
  const [weatherData, setweatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const apiKey = 'b4d4d39a000cd956500a0f09059acaf8';

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      }),
    });


    setupNotifications();
    getDeviceWeather();
  }, []);

   const setupNotifications = async () => {
    if (Device.isDevice) {
      const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
            Alert.alert('Permission required', 'Notifications need to be enabled to function.');
          return;
        }
      }
    } else {
      Alert.alert('Device Error', 'Push notifdications only work on physical devices.');
    }
  };

const getDeviceWeather = async () => {
setLoading(true);
setErrorMessage('');
setweatherData(null);

try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Location permission is required to get weather.');
      setLoading(false);
      return;
    }
    
const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: latitude,
        lon: longitude,
        appid: apiKey,
        units: 'metric',
      }
    });

    setweatherData(response.data);
  } catch (error) {
    setErrorMessage('Could not get weather data.');
  } finally {
setLoading(false);
  }
};

   const sendTestNotification = async () => {
    if (!weatherData) {
Alert.alert('Error', 'No weather data to send in the notification.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Weather Update for ${weatherData.name}`,
          body: `Current temperature: ${weatherData.main.temp}°C`
        },
        trigger: { seconds: 2 },
      });
      console.log('Notification scheduled successfully.');
    } catch (error) {
console.error('Notification scheduling error:', error);
    }
  };

const dismissKeyboard = () => {
Keyboard.dismiss();
  };

  return (
<TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
      <Text style={styles.title}>Weather Info</Text>

      <Button title="Get Weather" onPress={getDeviceWeather} />

      {loading && <Text>Loading weather...</Text>}
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        {weatherData && (
          <View style={styles.weatherInfo}>
            <Text style={styles.city}>{weatherData.name}</Text>
            <Text>Temperature: {weatherData.main.temp}°C</Text>
            <Text>Sky: {weatherData.weather[0].description}</Text>
            <Text>Humidity: {weatherData.main.humidity}%</Text>
            <Text>Wind: {weatherData.wind.speed} m/s</Text>
          </View>
        )}

        {weatherData && (
          <Button title="Send Weather Notification" onPress={sendTestNotification} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
  justifyContent: 'center',
    alignItems: 'center',
padding: 20
  },
title: {
  fontSize: 28,
    marginBottom: 20,
  },
error: {
color: 'red',
    marginTop: 10,
},
weatherInfo: {
marginTop: 20,
alignItems: 'center'
  },
city: {
    fontSize: 24,
    fontWeight: 'bold',
marginBottom: 10
  }
});

export default WeatherApp;
