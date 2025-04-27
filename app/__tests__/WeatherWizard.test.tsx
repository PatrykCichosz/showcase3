import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import WeatherWizard from '../weatherWizard'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert, Linking } from 'react-native'

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync:    jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync:      jest.fn().mockResolvedValue({ data: 'token' }),
  setNotificationHandler:     jest.fn(),
  scheduleNotificationAsync:  jest.fn(),
}))

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync:          jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}))

jest.mock('axios')
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}))

jest.spyOn(Alert, 'alert').mockImplementation(() => {})

const weatherResponse = {
  data: {
    name: 'Test City',
    main: { temp: 20, humidity: 50 },
    weather: [{ main: 'Clear', description: 'clear sky' }],
    wind: { speed: 5 },
    rain: { '1h': 1 },
    id: 123,
  }
}

const forecastList = Array(8 * 5).fill(0).map((_, i) => ({
  dt_txt: (new Date(2025,0,1+i/8)).toISOString(),
  main: { temp: 10 + i },
  weather: [{ description: 'rain' }],
}))

const forecastResponse = { data: { list: forecastList } }

beforeEach(() => {
  ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
  ;(Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({ coords: { latitude: 0, longitude: 0 } })
  ;(axios.get as jest.Mock).mockImplementation(url => {
    if (url.includes('/weather')) return Promise.resolve(weatherResponse)
    if (url.includes('/forecast')) return Promise.resolve(forecastResponse)
  })
  ;(Notifications.scheduleNotificationAsync as jest.Mock).mockClear()
  ;(axios.get as jest.Mock).mockClear()
  ;(Linking.openURL as jest.Mock).mockClear()
  ;(Alert.alert as jest.Mock).mockClear()
})

it('renders the three main buttons', () => {
  const { getByText } = render(<WeatherWizard />)
  getByText('Set Alert Criteria')
  getByText('Test Notification')
  getByText('Refresh')
})

it('opens the criteria modal', () => {
  const { getByText } = render(<WeatherWizard />)
  fireEvent.press(getByText('Set Alert Criteria'))
  getByText('Choose Criteria')
  getByText('Temperature')
  getByText('Humidity')
  getByText('Rain')
})

it('alerts error if Test Notification pressed without selecting criteria', () => {
  const { getByText } = render(<WeatherWizard />)
  fireEvent.press(getByText('Test Notification'))
  expect(Alert.alert).toHaveBeenCalledWith('Error', 'Select criteria and condition')
})

it('fetches and displays weather info', async () => {
  const { getByText } = render(<WeatherWizard />)
  await waitFor(() => getByText('Test City'))
  getByText('20°C')
})

it('sends a notification when criteria is met', async () => {
  const { getByText, getByPlaceholderText } = render(<WeatherWizard />)

  await waitFor(() => getByText('Test City'))

  fireEvent.press(getByText('Set Alert Criteria'))
  fireEvent.press(getByText('Temperature'))
  fireEvent.changeText(getByPlaceholderText('Value'), '15')
  fireEvent.press(getByText('Above'))
  fireEvent.press(getByText('Test Notification'))

  await waitFor(() => {
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({ body: 'Temp above 15°C' }),
        trigger:   null
      })
    )
  })
})

it('refresh button re-fetches weather', async () => {
  const { getByText } = render(<WeatherWizard />)
  await waitFor(() => getByText('Test City'))
  ;(axios.get as jest.Mock).mockClear()
  fireEvent.press(getByText('Refresh'))
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledTimes(2)
})
})

it('opens forecast link when a forecast card is pressed', async () => {
  const { getAllByText, getByText } = render(<WeatherWizard />)
  await waitFor(() => getByText('Test City'))
  const cards = getAllByText('rain')
  fireEvent.press(cards[0])
  expect(Linking.openURL).toHaveBeenCalledWith('https://openweathermap.org/city/123')
})