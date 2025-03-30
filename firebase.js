import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYUhm_Fff58F835bFdNPi2qrZTFNU6B8I",
  authDomain: "notiapp-a3e3b.firebaseapp.com",
  projectId: "notiapp-a3e3b",
  storageBucket: "notiapp-a3e3b.firebasestorage.app",
  messagingSenderId: "359267900916",
  appId: "1:359267900916:web:468ebe7998abad8fd3ada1",
  measurementId: "G-4DP977LHCV"
};


const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized:", app);


const firestore = getFirestore(app);
console.log("Firestore initialized:", firestore);

export { firestore };
