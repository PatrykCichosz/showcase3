import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';

const Home = ({ navigation }) => {
  const handleNav = (screen) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      Alert.alert("Error", `Could not navigate to ${screen}`);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/background.jpg')} 
      style={styles.background} 
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>NotiApp</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#009900' }]} 
            onPress={() => handleNav('BusBuddy')}
          >
            <Text style={styles.buttonText}>BusBuddy</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#0080FF' }]} 
            onPress={() => handleNav('WeatherWizard')}
          >
            <Text style={styles.buttonText}>WeatherWizard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FF0000' }]} 
            onPress={() => handleNav('TrendTracker')}
          >
            <Text style={styles.buttonText}>TrendTracker</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 50,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 15,
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Home;
