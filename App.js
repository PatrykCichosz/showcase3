import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomePage from './app/home';
import WeatherWizard from './app/weatherWizard';
import BusBuddy from './app/busBuddy';
import TrendTracker from './app/trendTracker';
<<<<<<< HEAD
import { LogBox } from 'react-native';

if (__DEV__) {
  LogBox.ignoreLogs([
    'expo-notifications: Push notifications (remote notifications) functionality provided by expo-notifications will be removed from Expo Go in SDK 53.',
    'expo-notifications functionality is not fully supported in Expo Go',
  ]);
}
=======
>>>>>>> origin/main

const Nav = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Nav.Navigator>
        <Nav.Screen name="Home" component={HomePage} />
        <Nav.Screen name="WeatherWizard" component={WeatherWizard} />
        <Nav.Screen name="BusBuddy" component={BusBuddy} />
        <Nav.Screen name="TrendTracker" component={TrendTracker} />
      </Nav.Navigator>
    </NavigationContainer>
  );
};
<<<<<<< HEAD

=======
 
>>>>>>> origin/main
export default App;
