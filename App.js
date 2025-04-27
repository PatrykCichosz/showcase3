import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomePage from './app/home';
import WeatherWizard from './app/weatherWizard';
import BusBuddy from './app/busBuddy';
import { LogBox } from 'react-native';

if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Push notifications (remote notifications) functionality provided by expo-notifications will be removed from Expo Go in SDK 53.',
    'expo-notifications functionality is not fully supported in Expo Go',
  ]);
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#cccccc',
          tabBarStyle: {
            backgroundColor: '#00796b',
            borderTopWidth: 0,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 4,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName = 'home-outline';
            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'WeatherWizard') {
              iconName = 'cloud-outline';
            } else if (route.name === 'BusBuddy') {
              iconName = 'bus-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomePage} />
        <Tab.Screen name="WeatherWizard" component={WeatherWizard} options={{ title: 'Weather' }} />
        <Tab.Screen name="BusBuddy" component={BusBuddy} options={{ title: 'Bus' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}