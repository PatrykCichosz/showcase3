import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('bus_stops.db');

export const initializeDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS bus_stops (
        stop_id TEXT PRIMARY KEY, 
        stop_code TEXT, 
        stop_name TEXT, 
        stop_desc TEXT, 
        stop_lat REAL, 
        stop_lon REAL, 
        zone_id TEXT, 
        stop_url TEXT, 
        location_type INTEGER, 
        parent_station TEXT
      );`,
      [],
      () => console.log('Database initialized successfully'),
      (_, error) => console.error('Error initializing database', error)
    );
  });
};

export const insertBusStop = (busStop) => {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO bus_stops 
        (stop_id, stop_code, stop_name, stop_desc, stop_lat, stop_lon, zone_id, stop_url, location_type, parent_station) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        busStop.stop_id, 
        busStop.stop_code, 
        busStop.stop_name, 
        busStop.stop_desc, 
        busStop.stop_lat, 
        busStop.stop_lon, 
        busStop.zone_id, 
        busStop.stop_url, 
        busStop.location_type, 
        busStop.parent_station
      ],
      () => console.log(`Inserted stop: ${busStop.stop_name}`),
      (_, error) => console.error('Error inserting bus stop', error)
    );
  });
};

export const getBusStops = (callback) => {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM bus_stops;`,
      [],
      (_, { rows }) => callback(rows._array),
      (_, error) => console.error('Error fetching bus stops', error)
    );
  });
};
