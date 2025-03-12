import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState('');
  const [criteriaValue, setCriteriaValue] = useState('');
  const [condition, setCondition] = useState('');
  const [showCriteriaMenu, setShowCriteriaMenu] = useState(false);
  const [pushToken, setPushToken] = useState(null);  // To store the push token
  const apiKey = 'b4d4d39a000cd956500a0f09059acaf8';

  useEffect(() => {
    getDeviceWeather();
    registerForPushNotifications();
  }, []);

  // Register the device for push notifications
  const registerForPushNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Notification permission is required.');
      return;
    }
    const token = await Notifications.getExpoPushTokenAsync();
    setPushToken(token.data);
  };

  const getDeviceWeather = async () => {
    setLoading(true);
    setErrorMessage('');
    setWeatherData(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission is required to fetch weather.');
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

      setWeatherData(response.data);
    } catch (error) {
      setErrorMessage('Could not retrieve weather data. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle test notification
  const handleTestNotification = async () => {
    if (!selectedCriteria || !criteriaValue || !condition) {
      Alert.alert('Error', 'Please select a criterion, condition (above/below/yes/no), and set the value.');
      return;
    }

    if (!weatherData) {
      Alert.alert('Error', 'Weather data is not available.');
      return;
    }

    let conditionMet = false;
    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const rain = weatherData.rain ? weatherData.rain['1h'] : 0; // Rain volume in last 1 hour

    switch (selectedCriteria) {
      case 'Temperature':
        if (condition === 'Above' && temp > criteriaValue) {
          conditionMet = true;
        } else if (condition === 'Below' && temp < criteriaValue) {
          conditionMet = true;
        }
        break;

      case 'Humidity':
        if (condition === 'Above' && humidity > criteriaValue) {
          conditionMet = true;
        } else if (condition === 'Below' && humidity < criteriaValue) {
          conditionMet = true;
        }
        break;

      case 'Rain':
        if (condition === 'Yes' && rain > 0) {
          conditionMet = true;
        } else if (condition === 'No' && rain === 0) {
          conditionMet = true;
        }
        break;

      default:
        break;
    }

    if (conditionMet && pushToken) {
      // Send a notification if the condition is met
      await sendPushNotification();
    } else {
      Alert.alert('Notification Not Sent', `The ${selectedCriteria} condition has not been met.`);
    }
  };

  // Send a push notification using Expo Notifications (native-like notification)
  const sendPushNotification = async () => {
    const message = {
      to: pushToken,
      sound: 'default',
      title: 'Weather Notification',
      body: `The ${selectedCriteria} condition has been met!`,
      data: { criteria: selectedCriteria },
    };

    try {
      // Expo Notifications: Send immediate push notification
      await Notifications.scheduleNotificationAsync({
        content: message,
        trigger: null, // trigger it immediately
      });
      // Alert.alert('Notification Sent', `The ${selectedCriteria} condition has been met!`);
    } catch (error) {
      console.error('Error sending notification', error);
    }
  };

  const toggleCriteriaMenu = () => {
    setShowCriteriaMenu(!showCriteriaMenu);
  };

  // Dismiss keyboard function
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WeatherWizard</Text>

      <TouchableOpacity style={styles.button} onPress={getDeviceWeather}>
        <Text style={styles.buttonText}>Get Weather</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#00C6FF" />}
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      {weatherData && (
        <View style={styles.weatherInfo}>
          <Text style={styles.city}>{weatherData.name}</Text>
          <Text style={styles.weatherText}>🌡 Temperature: {weatherData.main.temp}°C</Text>
          <Text style={styles.weatherText}>🌥 Sky: {weatherData.weather[0].description}</Text>
          <Text style={styles.weatherText}>💧 Humidity: {weatherData.main.humidity}%</Text>
          <Text style={styles.weatherText}>💨 Wind: {weatherData.wind.speed} m/s</Text>
          <Text style={styles.weatherText}>🌧 Rain: {weatherData.rain ? weatherData.rain['1h'] : 0} mm</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={toggleCriteriaMenu}>
        <Text style={styles.buttonText}>Set Notification Criteria</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
        <Text style={styles.buttonText}>Test Notification</Text>
      </TouchableOpacity>

      <Modal
        visible={showCriteriaMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleCriteriaMenu}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.criteriaText}>Select Criterion:</Text>

              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Temperature' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Temperature')}
              >
                <Text style={styles.buttonText}>Temperature</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Humidity' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Humidity')}
              >
                <Text style={styles.buttonText}>Humidity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.criteriaButton, selectedCriteria === 'Rain' && styles.selectedButton]}
                onPress={() => setSelectedCriteria('Rain')}
              >
                <Text style={styles.buttonText}>Rain</Text>
              </TouchableOpacity>

              {selectedCriteria && (
                <View>
                  <Text style={styles.criteriaText}>Choose condition:</Text>

                  {selectedCriteria === 'Temperature' || selectedCriteria === 'Humidity' ? (
                    <View>
                      <TouchableOpacity
                        style={[styles.criteriaButton, condition === 'Above' && styles.selectedButton]}
                        onPress={() => setCondition('Above')}
                      >
                        <Text style={styles.buttonText}>Above</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.criteriaButton, condition === 'Below' && styles.selectedButton]}
                        onPress={() => setCondition('Below')}
                      >
                        <Text style={styles.buttonText}>Below</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedCriteria === 'Rain' && (
                    <View>
                      <TouchableOpacity
                        style={[styles.criteriaButton, condition === 'Yes' && styles.selectedButton]}
                        onPress={() => setCondition('Yes')}
                      >
                        <Text style={styles.buttonText}>Yes</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.criteriaButton, condition === 'No' && styles.selectedButton]}
                        onPress={() => setCondition('No')}
                      >
                        <Text style={styles.buttonText}>No</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder={`Enter ${selectedCriteria} value`}
                    value={criteriaValue}
                    onChangeText={setCriteriaValue}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <TouchableOpacity style={styles.button} onPress={toggleCriteriaMenu}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1C1C',
  },
  title: {
    fontSize: 24,
    color: '#00C6FF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00C6FF',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  weatherInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  city: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  weatherText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1C1C1C',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  criteriaText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  criteriaButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#00C6FF',
  },
  doneButtonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#00C6FF',
    padding: 10,
    borderRadius: 8,
    width: '50%',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    marginVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default WeatherApp;
