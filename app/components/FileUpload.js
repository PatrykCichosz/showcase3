import React, { useState } from 'react';
import { View, Button, Text, Platform } from 'react-native';
import Papa from 'papaparse';
import { ref, set, push } from "firebase/database"; // For Realtime Database
// or
import { collection, addDoc } from "firebase/firestore"; // For Firestore
import db from '../firebaseConfig'; // Firebase config

const FileUpload = () => {
  const [message, setMessage] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      parseStopsFile(file);
    }
  };

  const parseStopsFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const parsedData = Papa.parse(text, { header: true, skipEmptyLines: true }).data;

      parsedData.forEach(stop => {
        addStopToFirebase(stop); // Or addStopToFirestore(stop);
      });
    };
    reader.readAsText(file);
  };

  const addStopToFirebase = (stop) => {
    const busStopsRef = ref(db, 'busStops');
    const newStopRef = push(busStopsRef);
    set(newStopRef, stop)
      .then(() => {
        setMessage('Stop added successfully');
      })
      .catch((error) => {
        setMessage(`Error adding stop: ${error.message}`);
      });
  };

  // For Firestore
  const addStopToFirestore = async (stop) => {
    try {
      const docRef = await addDoc(collection(db, "busStops"), stop);
      setMessage(`Stop added with ID: ${docRef.id}`);
    } catch (e) {
      setMessage(`Error adding stop: ${e.message}`);
    }
  };

  return (
    <View>
      <input type="file" onChange={handleFileUpload} />
      <Text>{message}</Text>
    </View>
  );
};

export default FileUpload;
