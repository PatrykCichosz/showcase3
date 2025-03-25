import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to read stops.txt and parse data
export const loadStopsFromFile = async () => {
  try {
    // Read the stops.txt file from local assets
    const fileUri = FileSystem.documentDirectory + 'stops.txt';
    const fileExists = await FileSystem.getInfoAsync(fileUri);

    if (!fileExists.exists) {
      console.log("Stops file not found!");
      return [];
    }

    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    const lines = fileContent.split('\n');

    const stops = lines.slice(1) // Remove header
      .map(line => line.split(','))
      .filter(cols => cols.length >= 6) // Ensure valid row
      .map(cols => ({
        id: cols[0]?.trim(),
        code: cols[1]?.trim(),
        name: cols[2]?.trim(),
        latitude: parseFloat(cols[4]?.trim()),
        longitude: parseFloat(cols[5]?.trim())
      }));

    // Save to AsyncStorage
    await AsyncStorage.setItem('busStops', JSON.stringify(stops));
    console.log("Bus stops loaded from file.");
    return stops;
  } catch (error) {
    console.error("Error reading stops file:", error);
    return [];
  }
};

// Retrieve stops from local storage
export const getLocalStops = async () => {
  try {
    const data = await AsyncStorage.getItem('busStops');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error fetching local stops:", error);
    return [];
  }
};
