import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator } from 'react-native';
import axios from 'axios';

const WeatherMagic = () => {
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState('');

  const getWeather = () => {
    if (!city) return;
    setIsLoading(true);
    setErr('');

    axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        appid: 'b4d4d39a000cd956500a0f09059acaf8',
        units: 'metric',
      }
    })
    .then(res => setData(res.data))
    .catch(() => setErr('Could not find that city.'))
    .finally(() => setIsLoading(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Weather Wizard</Text>

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      <Button title="Weather info" onPress={getWeather} />

      {isLoading && <ActivityIndicator/>}

      {err && <Text style={styles.error}>{err}</Text>}

      {data && (
        <View style={styles.info}>
          <Text style={styles.city}>{data.name}</Text>
          <Text>Temp: {data.main.temp}°C</Text>
          <Text>Sky: {data.weather[0].description}</Text>
          <Text>Hum: {data.main.humidity}%</Text>
          <Text>Wind: {data.wind.speed} m/s</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  heading: {
    fontSize: 30,
    marginBottom: 20,
  },
  input: {
    height: 45,
    borderWidth: 2,
    width: '80%',
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
  },
  loader: {
    marginTop: 15,
  },
  error: {
    color: '#FF0000',
    marginTop: 10,
  },
  info: {
    marginTop: 20,
    alignItems: 'center',
  },
  city: {
    fontSize: 35,
  },
});

export default WeatherMagic;