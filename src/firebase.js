import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore"
import dotenv from 'dotenv';

dotenv.config();

initializeApp({
    apiKey: process.env.NODE_APP_API_KEY,
    authDomain: process.env.NODE_APP_AUTH_DOMAIN,
    databaseURL: process.env.NODE_APP_DATABASE_URL,
    projectId: process.env.NODE_APP_PROJECT_ID,
    storageBucket: process.env.NODE_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.NODE_APP_MESSAGING_SENDER_ID,
    appId: process.env.NODE_APP_APP_ID
});

const db = getFirestore();

export const getUserByEmail = async (email) => {
  let users = [];
  const q = query(collection(db, 'Users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    users.push(doc.data());
  });
  return users[0];
};

export const getPlaceByName = async (placeName) => {
  let places = [];
  const q = query(collection(db, 'Places'), where('Name', '==', placeName));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    places.push(doc.data());
  });
  return places[0];
};

export const getDeviceByName = async (deviceName) => {
  let devices = [];
  const q = query(collection(db, 'Devices'), where('Name', '==', deviceName));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    devices.push(doc.data());
  });
  return devices[0];
};

export const getDevicesByPlace = async (placeName) => {
  let devices = [];
  const q = query(collection(db, 'Devices'), where('PlaceName', '==', placeName));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    devices.push(doc.data());
  });
  return devices;
};

