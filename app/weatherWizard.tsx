import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ImageBackground,
  ScrollView,
  Linking,
  Animated,
  Easing
} from 'react-native'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface WeatherData {
  name: string
  main: { temp: number; humidity: number }
  weather: { main: string; description: string }[]
  wind: { speed: number }
  rain?: { '1h': number }
  id: number
}

interface ForecastItem {
  dt_txt: string
  main: { temp: number }
  weather: { description: string }[]
}

const apiKey = 'b4d4d39a000cd956500a0f09059acaf8'

const WeatherWizard: React.FC = () => {
  const [weatherData, setWeatherData]       = useState<WeatherData | null>(null)
  const [forecastData, setForecastData]     = useState<ForecastItem[]>([])
  const [loading, setLoading]               = useState(false)
  const [errorMessage, setErrorMessage]     = useState('')
  const [showCriteriaMenu, setShowCriteriaMenu]         = useState(false)
  const [selectedCriteria, setSelectedCriteria]         = useState<'Temperature'|'Humidity'|'Rain'>()
  const [criteriaValue, setCriteriaValue]               = useState('')
  const [condition, setCondition]                       = useState<'Above'|'Below'|'Yes'|'No'>()
  const [background, setBackground]                     = useState(require('../assets/clear_sky.jpg'))
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert:   true,
        shouldPlaySound:   true,
        shouldSetBadge:    false,
      }),
    })
  }, [])

  useEffect(() => {
    fetchWeather()
    registerNotifications()
  }, [])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        800,
      easing:          Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [weatherData, forecastData])

  async function registerNotifications() {
    const res = await Notifications.requestPermissionsAsync()
    if (res.status !== 'granted') return
    const token = await Notifications.getExpoPushTokenAsync()
    await AsyncStorage.setItem('pushToken', token.data)
  }

  async function fetchWeather() {
    setLoading(true)
    setErrorMessage('')
    try {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') {
        setErrorMessage('Location permission required')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = loc.coords

      const [weatherRes, forecastRes] = await Promise.all([
        axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { lat: latitude, lon: longitude, appid: apiKey, units: 'metric' }
        }),
        axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: { lat: latitude, lon: longitude, appid: apiKey, units: 'metric' }
        })
      ])

      setWeatherData(weatherRes.data)
      setForecastData(
        forecastRes.data.list.filter((_: any, i: number) => i % 8 === 0).slice(0, 5)
      )
      const cond = weatherRes.data.weather[0].main.toLowerCase()
      setBackground(selectBackground(cond))

    } catch {
      setErrorMessage('Unable to retrieve weather.')
    } finally {
      setLoading(false)
    }
  }

  function selectBackground(cond: string) {
    switch (cond) {
      case 'clear':        return require('../assets/clear_sky.jpg')
      case 'clouds':       return require('../assets/digital-art-isolated-house.jpg')
      case 'rain':         return require('../assets/rainy_sky.jpg')
      case 'snow':         return require('../assets/snowy_sky.jpg')
      case 'thunderstorm': return require('../assets/thunderstorm_sky.jpg')
      case 'drizzle':      return require('../assets/drizzle_sky.jpg')
      default:             return require('../assets/clear_sky.jpg')
    }
  }

  async function sendNotification(message: string) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Weather Alert', body: message, sound: 'default' },
      trigger: null,
    })
  }

  async function testNotification() {
    if (!selectedCriteria || !condition) {
      Alert.alert('Error', 'Select criteria and condition')
      return
    }
    if (!weatherData) {
      Alert.alert('Error', 'No weather data')
      return
    }

    const t = weatherData.main.temp
    const h = weatherData.main.humidity
    const r = weatherData.rain?.['1h'] || 0

    let met = false
    let text = ''

    if (selectedCriteria === 'Temperature') {
      const v = parseFloat(criteriaValue)
      if (condition === 'Above' && t > v) { met = true; text = `Temp above ${v}°C` }
      if (condition === 'Below' && t < v) { met = true; text = `Temp below ${v}°C` }
    }

    if (selectedCriteria === 'Humidity') {
      const v = parseFloat(criteriaValue)
      if (condition === 'Above' && h > v) { met = true; text = `Humidity above ${v}%` }
      if (condition === 'Below' && h < v) { met = true; text = `Humidity below ${v}%` }
    }

    if (selectedCriteria === 'Rain') {
      if (condition === 'Yes' && r > 0) { met = true; text = 'Rain detected' }
      if (condition === 'No' && r === 0) { met = true; text = 'No rain' }
    }

    if (met) {
      await sendNotification(text)
    } else {
      Alert.alert('Not met', `${selectedCriteria} ${condition} ${criteriaValue}`)
    }
  }

  return (
    <ImageBackground source={background} style={styles.background}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && <ActivityIndicator size="large" color="#fff" />}
        {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        {weatherData && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.info}>
              <Text style={styles.city}>{weatherData.name}</Text>
              <Text style={styles.temp}>{Math.round(weatherData.main.temp)}°C</Text>
              <Text style={styles.desc}>{weatherData.weather[0].description}</Text>
              <Text style={styles.detail}>💧 {weatherData.main.humidity}%</Text>
              <Text style={styles.detail}>💨 {weatherData.wind.speed} m/s</Text>
              <Text style={styles.detail}>🌧 {(weatherData.rain?.['1h'] || 0).toFixed(1)} mm</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecast}>
              {forecastData.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(`https://openweathermap.org/city/${weatherData.id}`)}
                >
                  <View style={styles.card}>
                    <Text style={styles.cardDate}>{new Date(f.dt_txt).toLocaleDateString()}</Text>
                    <Text style={styles.cardTemp}>{Math.round(f.main.temp)}°C</Text>
                    <Text style={styles.cardDesc}>{f.weather[0].description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={() => setShowCriteriaMenu(true)}>
            <Text style={styles.btnText}>Set Alert Criteria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={testNotification}>
            <Text style={styles.btnText}>Test Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={fetchWeather}>
            <Text style={styles.btnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showCriteriaMenu} transparent>
        <TouchableWithoutFeedback onPress={() => { setShowCriteriaMenu(false); Keyboard.dismiss() }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Choose Criteria</Text>
              {['Temperature','Humidity','Rain'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.option, selectedCriteria === c && styles.selected]}
                  onPress={() => setSelectedCriteria(c as any)}
                >
                  <Text style={styles.optionText}>{c}</Text>
                </TouchableOpacity>
              ))}

              {selectedCriteria && selectedCriteria !== 'Rain' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Value"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={criteriaValue}
                    onChangeText={setCriteriaValue}
                  />
                  <View style={styles.conds}>
                    {['Above','Below'].map(cond => (
                      <TouchableOpacity
                        key={cond}
                        style={[styles.condBtn, condition === cond && styles.selected]}
                        onPress={() => setCondition(cond as any)}
                      >
                        <Text style={styles.optionText}>{cond}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {selectedCriteria === 'Rain' && (
                <View style={styles.conds}>
                  {['Yes','No'].map(cond => (
                    <TouchableOpacity
                      key={cond}
                      style={[styles.condBtn, condition === cond && styles.selected]}
                      onPress={() => setCondition(cond as any)}
                    >
                      <Text style={styles.optionText}>{cond}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background:   { flex: 1, resizeMode: 'cover' },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 20 },
  info:         { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 20, alignItems: 'center' },
  city:         { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  temp:         { fontSize: 48, color: '#fff', marginVertical: 8 },
  desc:         { fontSize: 20, color: '#fff', marginBottom: 8, textTransform: 'capitalize' },
  detail:       { fontSize: 16, color: '#fff', marginVertical: 2 },
  forecast:     { marginTop: 20 },
  card:         { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 12, marginRight: 12, alignItems: 'center' },
  cardDate:     { color: '#fff', fontWeight: '600' },
  cardTemp:     { color: '#fff', fontSize: 18, marginVertical: 4 },
  cardDesc:     { color: '#fff', fontSize: 14, textTransform: 'capitalize' },
  controls:     { marginTop: 30, alignItems: 'center' },
  btn:          { backgroundColor: '#00C6FF', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  error:        { color: '#f00', textAlign: 'center', marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal:        { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle:   { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  option:       { padding: 12, borderRadius: 8, backgroundColor: '#eee', marginVertical: 6 },
  optionText:   { textAlign: 'center', fontSize: 16 },
  selected:     { backgroundColor: '#00C6FF' },
  input:        { borderWidth: 1, borderColor: '#00C6FF', borderRadius: 8, padding: 10, marginTop: 12, color: '#000' },
  conds:        { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  condBtn:      { padding: 10, borderRadius: 8, backgroundColor: '#eee', width: '45%', alignItems: 'center' },
})

export default WeatherWizard