// Firebase CDN imports (no npm required)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD4yz8pUs9nnozh61VOWJ9JVP8E1b489eY',
  authDomain: 'panasa-cms.firebaseapp.com',
  databaseURL: 'https://panasa-cms-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'panasa-cms',
  storageBucket: 'panasa-cms.firebasestorage.app',
  messagingSenderId: '949564552221',
  appId: '1:949564552221:web:2415535f8f8c367a6ac2f4',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
