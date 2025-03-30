import fs from 'fs';
import path from 'path';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = path.resolve('notiapp-a3e3b-firebase-adminsdk-fbsvc-0779a07a3b.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();


const filePath = './stops.txt'; 


const uploadStops = () => {
  fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
      console.error('Error reading stops.txt:', err);
      return;
    }

    const stops = data.split('\n').map((line) => {
      const [stopId, stopCode, stopName, stopDesc, stopLat, stopLon, zoneId, stopUrl, locationType, parentStation] = line.split(',');


      if (stopId && stopCode && stopName && stopLat && stopLon) {
        return {
          stopId: stopId.trim(),
          stopCode: stopCode.trim(),
          stopName: stopName.trim(),
          stopDesc: stopDesc ? stopDesc.trim() : '',
          stopLat: parseFloat(stopLat.trim()),
          stopLon: parseFloat(stopLon.trim()),
          zoneId: zoneId ? zoneId.trim() : '',
          stopUrl: stopUrl ? stopUrl.trim() : '',
          locationType: locationType ? locationType.trim() : '',
          parentStation: parentStation ? parentStation.trim() : '',
        };
      }
      return null;
    }).filter(stop => stop !== null);


    for (const stop of stops) {
      try {
        const stopRef = db.collection('stops').doc(stop.stopId);
        await stopRef.set(stop);
        console.log(`Stop ${stop.stopId} added to Firestore`);
      } catch (error) {
        console.error('Error uploading stop:', error);
      }
    }

    console.log('All stops uploaded!');
  });
};

uploadStops();