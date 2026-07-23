// Firebase CDN imports (no npm required)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAfbiJQSnvtr066r2aLIF7MXbqRpHVIu-g',
  authDomain: 'panasa-cms-ad3f9.firebaseapp.com',
  databaseURL: 'https://panasa-cms-ad3f9-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'panasa-cms-ad3f9',
  storageBucket: 'panasa-cms-ad3f9.firebasestorage.app',
  messagingSenderId: '802994559718',
  appId: '1:802994559718:web:16bef317ccd67ffee3b927',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
