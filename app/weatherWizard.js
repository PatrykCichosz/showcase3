import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Keyboard, TouchableWithoutFeedback, ImageBackground, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogBox } from 'react-native';

if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Push notifications (remote notifications) functionality provided by expo-notifications will be removed from Expo Go in SDK 53.',
    'expo-notifications functionality is not fully supported in Expo Go',
  ]);
}

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState('');
  const [criteriaValue, setCriteriaValue] = useState('');
  const [condition, setCondition] = useState('');
  const [showCriteriaMenu, setShowCriteriaMenu] = useState(false);
  const [pushToken, setPushToken] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const apiKey = 'b4d4d39a000cd956500a0f09059acaf8';
  const [weatherBackground, setWeatherBackground] = useState('');
  
  useEffect(() => {
    getDeviceWeather();
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Notification permission is required.');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    setPushToken(token.data);
    await AsyncStorage.setItem('pushToken', token.data);
  };

  const getDeviceWeather = async () => {
    setLoading(true);
    setErrorMessage('');
    setWeatherData(null);
    setForecastData(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission is required to fetch weather.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
      });

      const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
      });

      setWeatherData(weatherResponse.data);
      setForecastData(forecastResponse.data.list.filter((item, index) => index % 8 === 0).slice(0, 5));

      const weatherCondition = weatherResponse.data.weather[0].main.toLowerCase();
      setWeatherBackground(getBackgroundForWeatherCondition(weatherCondition));
    } catch (error) {
      setErrorMessage('Could not retrieve weather data. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundForWeatherCondition = (condition) => {
    switch (condition) {
      case 'clear':
        return require('../assets/beautiful-clouds-digital-art_23-2151105870.jpg');
      case 'clouds':
        return require('../assets/digital-art-isolated-house.jpg');
      case 'rain':
        return require('../assets/rainy_sky.jpg');
      case 'thunderstorm':
        return require('../assets/thunderstorm_sky.jpg');
      case 'snow':
        return require('../assets/snowy_sky.jpg');
      case 'drizzle':
        return require('../assets/drizzle_sky.jpg');
      default:
        return require('../assets/clear_sky.jpg');
    }
  };
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const handleTestNotification = async () => {
    if (!selectedCriteria || !criteriaValue || !condition) {
      Alert.alert('Error', 'Please select a criteria, condition (above/below/yes/no), and set the value.');
      return;
    }
  
    if (!weatherData) {
      Alert.alert('Error', 'Weather data is not available.');
      return;
    }
  
    let conditionMet = false;
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const rain = weatherData.rain ? weatherData.rain['1h'] : 0;
  
    let conditionText = '';
  
    switch (selectedCriteria) {
      case 'Temperature':
        if (condition === 'Above' && temp > criteriaValue) {
          conditionMet = true;
          conditionText = `Temperature Above ${criteriaValue}°C`;
        } else if (condition === 'Below' && temp < criteriaValue) {
          conditionMet = true;
          conditionText = `Temperature Below ${criteriaValue}°C`;
        }
        break;
  
      case 'Humidity':
        if (condition === 'Above' && humidity > criteriaValue) {
          conditionMet = true;
          conditionText = `Humidity Above ${criteriaValue}%`;
        } else if (condition === 'Below' && humidity < criteriaValue) {
          conditionMet = true;
          conditionText = `Humidity Below ${criteriaValue}%`;
        }
        break;
  
      case 'Rain':
        if (condition === 'Yes' && rain > 0) {
          conditionMet = true;
          conditionText = 'Rainy conditions';
        } else if (condition === 'No' && rain === 0) {
          conditionMet = true;
          conditionText = 'No rain';
        }
        break;
  
      default:
        break;
    }
  
    if (conditionMet && pushToken) {
      await sendPushNotification(conditionText);
    } else {
      Alert.alert('Notification Not Sent', `The ${selectedCriteria} condition has not been met.`);
    }
  };

  const sendPushNotification = async (conditionText) => {
    const message = {
      to: pushToken,
      sound: 'default',
      title: 'Weather Notification',
      body: `The condition '${conditionText}' has been met!`,
      data: { criteria: selectedCriteria, conditionText: conditionText },
    };

    try {
      await Notifications.scheduleNotificationAsync({
        content: message,
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending notification', error);
    }
  };

  const toggleCriteriaMenu = () => {
    setShowCriteriaMenu(!showCriteriaMenu);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleForecastRedirect = (forecast) => {
    const forecastDate = new Date(forecast.dt_txt);
    const forecastURL = `https://openweathermap.org/city/${weatherData.id}?forecast=${forecastDate.toLocaleDateString()}`;
    Linking.openURL(forecastURL);
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={weatherBackground} style={styles.backgroundImage}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {loading && <ActivityIndicator size="large" color="#00C6FF" />}
          {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

          {weatherData && (
            <View style={styles.weatherInfo}>
              <Text style={styles.city}>{weatherData.name}</Text>
              <Text style={styles.temperature}>{weatherData.main.temp}°C</Text>
              <Text style={styles.weatherText}>🌥 {weatherData.weather[0].description}</Text>
              <Text style={styles.weatherText}>💧 Humidity: {weatherData.main.humidity}%</Text>
              <Text style={styles.weatherText}>💨 Wind: {weatherData.wind.speed} m/s</Text>
              <Text style={styles.weatherText}>🌧 Rain: {weatherData.rain ? weatherData.rain['1h'] : 0} mm</Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastContainer}>
            {forecastData && forecastData.map((forecast, index) => (
              <TouchableOpacity key={index} onPress={() => handleForecastRedirect(forecast)}>
                <View style={styles.forecastItem}>
                  <Text style={styles.forecastDate}>{new Date(forecast.dt_txt).toLocaleDateString()}</Text>
                  <Text style={styles.forecastText}>🌡 {forecast.main.temp}°C</Text>
                  <Text style={styles.forecastText}>🌥 {forecast.weather[0].description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCriteriaMenu}>
              <Text style={styles.buttonText}>Set Notification Criteria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { marginTop: 20, marginBottom: 20 }]} onPress={handleTestNotification}>
              <Text style={styles.buttonText}>Test Notification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>

      <Modal visible={showCriteriaMenu} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalContent}>
              <Text style={styles.criteriaText}>Step 1: Select Criteria</Text>
              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Temperature' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Temperature')}
              >
                <Text>Temperature</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Humidity' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Humidity')}
              >
                <Text>Humidity</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Rain' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Rain')}
              >
                <Text>Rain</Text>
              </TouchableOpacity>

              {selectedCriteria === 'Temperature' && (
                <View>
                  <TextInput
                    style={styles.criteriaInput}
                    placeholder="Set Value"
                    keyboardType="numeric"
                    value={criteriaValue}
                    onChangeText={setCriteriaValue}
                  />
                  <View style={styles.conditionContainer}>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'Above' && styles.selectedCondition]}
                      onPress={() => setCondition('Above')}
                    >
                      <Text>Above</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'Below' && styles.selectedCondition]}
                      onPress={() => setCondition('Below')}
                    >
                      <Text>Below</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedCriteria === 'Humidity' && (
                <View>
                  <TextInput
                    style={[styles.criteriaInput, { width: '90%' }]}
                    placeholder="Set Value"
                    keyboardType="numeric"
                    value={criteriaValue}
                    onChangeText={setCriteriaValue}
                  />
                  <View style={styles.conditionContainer}>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'Above' && styles.selectedCondition]}
                      onPress={() => setCondition('Above')}
                    >
                      <Text>Above</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'Below' && styles.selectedCondition]}
                      onPress={() => setCondition('Below')}
                    >
                      <Text>Below</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedCriteria === 'Rain' && (
                <View>
                  <View style={styles.conditionContainer}>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'Yes' && styles.selectedCondition]}
                      onPress={() => setCondition('Yes')}
                    >
                      <Text>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.conditionButton, condition === 'No' && styles.selectedCondition]}
                      onPress={() => setCondition('No')}
                    >
                      <Text>No</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={toggleCriteriaMenu}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
=======
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
>>>>>>> origin/main
  );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'flex-start',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  weatherInfo: {
    alignItems: 'center',
    marginTop: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 15,
    borderRadius: 10,
  },
  
  city: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
  },
  
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  
  weatherText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 5,
  },
  forecastContainer: {
    marginTop: 20,
  },
  forecastItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  forecastDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  forecastText: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#00C6FF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  criteriaButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#00C6FF',
  },
  criteriaInput: {
    height: 50,
    borderColor: '#00C6FF',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '80%',
  },
  conditionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  conditionButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    margin: 10,
  },
  selectedCondition: {
    backgroundColor: '#00C6FF',
  },
  closeButton: {
    backgroundColor: '#00C6FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFF',
  },
  error: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
=======
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
>>>>>>> origin/main
});

export default WeatherApp;
