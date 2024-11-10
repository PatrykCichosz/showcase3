import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const Home = ({ navigation }) => {
  const handleNav = (screen) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      Alert.alert("Error", `Cold not navigate to ${screen}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NotiApp</Text>

      <View style={styles.optionsContainer}>
        <Button
          title="BusBuddy"
          onPress={() => handleNav('BusBuddy')}
          color="#009900"
        />
        <Button
          title="WeatherWizard"
          onPress={() => handleNav('WeatherWizard')}
          color="#0080FF"
        />
        <Button
          title="TrendTracker"
          onPress={() => handleNav('TrendTracker')}
          color="#FF0000"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 32,
    marginBottom: 100,
  },
  optionsContainer: {
    justifyContent: 'space-around',
    width: '80%',
    flex: 0.5
  },
});
export default Home;