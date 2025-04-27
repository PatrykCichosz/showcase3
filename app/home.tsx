import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const Home: React.FC<{ navigation: any }> = ({ navigation }) => {
  const titleAnim = useRef(new Animated.Value(0)).current
  const buttonsAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(buttonsAnim, { toValue: 1, duration: 800, useNativeDriver: true })
    ]).start()
  }, [])

  const handleNav = (screen: string) => {
    try {
      navigation.navigate(screen)
    } catch {
      Alert.alert("Error", `Could not navigate to ${screen}`)
    }
  }

  return (
    <View style={styles.background}>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleAnim,
            transform: [
              {
                scale: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ]
          }
        ]}
      >
        NotiApp
      </Animated.Text>
      <Animated.View style={[styles.optionsContainer, { opacity: buttonsAnim }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#fff' }]}
          onPress={() => handleNav('BusBuddy')}
        >
          <Ionicons name="bus-outline" size={24} color="#004d40" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#004d40' }]}>BusBuddy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#fff' }]}
          onPress={() => handleNav('WeatherWizard')}
        >
          <Ionicons name="cloud-outline" size={24} color="#004d40" style={styles.icon} />
          <Text style={[styles.buttonText, { color: '#004d40' }]}>WeatherWizard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#004d40',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '70%',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600'
  },
  icon: {
    marginRight: 12
  }
})

export default Home
