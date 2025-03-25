import { initializeApp } from 'firebase/app';
import storage from '@react-native-firebase/storage';
import fs from 'react-native-fs';  // Use this library to interact with local file system

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6_0wzUuGUz8xOwpg8QxBDZZyTGuY0i8g",
  authDomain: "notiapp2-b62dc.firebaseapp.com",
  projectId: "notiapp2-b62dc",
  storageBucket: "notiapp2-b62dc.firebasestorage.app",
  messagingSenderId: "712880938080",
  appId: "1:712880938080:web:5a49572067aa07d24e3705",
  measurementId: "G-D4CJWFX01H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Path to your local JSON file (on device)
const localFilePath = '/path/to/your/all_shapes.json'; // Replace with the actual path

// Function to upload JSON file to Firebase Storage
const uploadJSONToFirebase = async () => {
  try {
    // Specify the file path in Firebase Storage (e.g., busRoutes/all_shapes.json)
    const reference = storage().ref('assets/all_shapes.json');
    
    // Upload the file to Firebase Storage
    await reference.putFile(localFilePath); // Upload the local file to Firebase Storage
    
    console.log('File uploaded successfully');
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

uploadJSONToFirebase();
