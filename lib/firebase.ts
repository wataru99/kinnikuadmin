import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

// Firebaseの初期化（シングルトンパターン）
function getFirebaseApp() {
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

function getFirestoreDb() {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    try {
      // キャッシュを有効化してオフライン対応・高速化
      db = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      // すでに初期化済みの場合
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

function getFirebaseStorage() {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// クライアントサイドでのみ初期化
if (typeof window !== "undefined") {
  app = getFirebaseApp();
  db = getFirestoreDb();
  storage = getFirebaseStorage();
  auth = getFirebaseAuth();
}

export { app, db, storage, auth };
