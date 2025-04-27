import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import BusBuddy from '../busBuddy'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('react-native-maps', () => {
  const React = require('react')
  const MockMap = ({ children, ...props }: any) =>
    React.createElement('MapView', props, children)
  const MockPolyline = (props: any) =>
    React.createElement('Polyline', props, null)
  const MockMarker: any = (props: any) => React.createElement('Marker', props, props.children)
  MockMarker.Animated = MockMarker
  class AnimatedRegion {
    constructor(init: any) {}
    setValue = jest.fn()
    timing = jest.fn().mockReturnValue({ start: jest.fn() })
  }
  return {
    __esModule: true,
    default: MockMap,
    Polyline: MockPolyline,
    Marker: MockMarker,
    AnimatedRegion,
  }
})

describe('BusBuddy', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders route input and Load button', () => {
    const { getByPlaceholderText, getByText } = render(<BusBuddy />)
    getByPlaceholderText('Enter Route')
    getByText('Load')
  })

  it('start button is enabled by default', () => {
    const { getByTestId } = render(<BusBuddy />)
    const startBtn = getByTestId('startJourneyButton')
    expect(startBtn.props.accessibilityState.disabled).toBe(false)
  })

  it('shows error when loading without a route', async () => {
    const { getByText } = render(<BusBuddy />)
    act(() => { fireEvent.press(getByText('Load')) })
    await waitFor(() => getByText('Enter a route number'))
  })

  it('toggles direction when Out/In button is pressed', () => {
    const { getByText } = render(<BusBuddy />)
    const toggleBtn = getByText('Out')
    fireEvent.press(toggleBtn)
    getByText('In')
    fireEvent.press(getByText('In'))
    getByText('Out')
  })

  it('updates routeInput when typing', () => {
    const { getByPlaceholderText } = render(<BusBuddy />)
    const input = getByPlaceholderText('Enter Route')
    fireEvent.changeText(input, '123')
    expect(input.props.value).toBe('123')
  })

  it('adds and deduplicates a favorite route', () => {
    const { getByPlaceholderText, getByText, getAllByText } = render(<BusBuddy />)
    fireEvent.changeText(getByPlaceholderText('Enter Route'), '42')
    fireEvent.press(getByText('★'))
    fireEvent.press(getByText('★'))
    const favs = getAllByText('42')
    expect(favs).toHaveLength(1)
  })

  it('opens stops modal when Stops button is pressed', () => {
    const { getByText } = render(<BusBuddy />)
    fireEvent.press(getByText('Stops'))
    getByText('Reset')
    getByText('Close')
  })

  it('opens number modal and selects a distance', () => {
    const { getByText, queryByText } = render(<BusBuddy />)
    fireEvent.press(getByText('🔢'))
    getByText('1 stops')
    fireEvent.press(getByText('3 stops'))
    expect(queryByText('1 stops')).toBeNull()
  })

  it('toggles theme icon when theme button is pressed', () => {
    const { getByText } = render(<BusBuddy />)
    const moon = getByText('🌙')
    fireEvent.press(moon)
    getByText('☀️')
    fireEvent.press(getByText('☀️'))
    getByText('🌙')
  })

  it('opens icon modal and selects a new icon', () => {
    const { getByText } = render(<BusBuddy />)
    fireEvent.press(getByText('Icon'))
    getByText('🚍')
    fireEvent.press(getByText('🚍'))
    getByText('🚍')
  })
})