const admin = require("firebase-admin");

let firebaseApp;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin SDK initialized");
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err.message);
    console.warn("Auth features will be unavailable.");
  }

  return firebaseApp;
}

function getAuth() {
  if (!firebaseApp) initializeFirebase();
  return admin.auth();
}

module.exports = { initializeFirebase, getAuth };
