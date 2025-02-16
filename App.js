import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomePage from './app/home';
import WeatherWizard from './app/weatherWizard';
import BusBuddy from './app/busBuddy';
import TrendTracker from './app/trendTracker';


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
 
export default App;
