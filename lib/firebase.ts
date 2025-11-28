import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvoo0nVLNtVPl5IFAS_s8gKkm92xM3FG0",
  authDomain: "chat-app-project-f0feb.firebaseapp.com",
  databaseURL: "https://chat-app-project-f0feb-default-rtdb.firebaseio.com",
  projectId: "chat-app-project-f0feb",
  storageBucket: "chat-app-project-f0feb.firebasestorage.app",
  messagingSenderId: "876466298880",
  appId: "1:876466298880:ios:11bef5fdac9cb4d5bf78e5",
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

if (typeof window !== "undefined") {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, db, storage, auth };
