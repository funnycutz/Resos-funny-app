// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDmOQlLWF-U5AGddQJkzKub0IyQDhhBSEM",
    authDomain: "resos-funny-app.firebaseapp.com",
    databaseURL: "https://resos-funny-app-default-rtdb.firebaseio.com",
    projectId: "resos-funny-app",
    storageBucket: "resos-funny-app.firebasestorage.app",
    messagingSenderId: "108548287829",
    appId: "1:108548287829:web:e76469baa2bb63f48653dc"
  };

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
