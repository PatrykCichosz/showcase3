import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const Home = ({ navigation }) => {
  const handleNav = (screen) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      Alert.alert("Error", `Could not navigate to ${screen}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NotiApp</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#009900' }]} onPress={() => handleNav('BusBuddy')}>
          <Text style={styles.buttonText}>BusBuddy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#0080FF' }]} onPress={() => handleNav('WeatherWizard')}>
          <Text style={styles.buttonText}>WeatherWizard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#FF0000' }]} onPress={() => handleNav('TrendTracker')}>
          <Text style={styles.buttonText}>TrendTracker</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 50,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Home;
