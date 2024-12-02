require("dotenv").config();
import admin from "firebase-admin";

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: "https://daralsharq-task-notesapp.firebaseio.com", // Firestore URL
  });
}

export const firestore = admin.firestore();
export const messaging = admin.messaging();
