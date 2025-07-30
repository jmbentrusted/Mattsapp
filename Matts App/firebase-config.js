import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
// Add setDoc to this import line
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMXgj9TWW0hjqelbfDEJHJGuzR9cXigRI",
    authDomain: "matts-transition-plan.firebaseapp.com",
    projectId: "matts-transition-plan",
    storageBucket: "matts-transition-plan.firebasestorage.app",
    messagingSenderId: "63824238795",
    appId: "1:63824238795:web:656da2a8d19cd1183be34e",
    measurementId: "G-7DRE31YDR7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the Firebase services and functions
export {
    db,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    setDoc // Add setDoc to the export list
};