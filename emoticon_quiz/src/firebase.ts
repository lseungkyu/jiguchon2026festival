import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// VITE_FIREBASE_DATABASE_URL을 기준으로 설정 여부 파악
const isConfigured = !!import.meta.env.VITE_FIREBASE_DATABASE_URL;

const app = isConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

const db = app ? getDatabase(app) : null;

if (!isConfigured) {
  console.warn(
    "⚠️ Firebase Database URL이 설정되지 않았습니다. 데모 모드(로컬 탭 동기화)로 실행됩니다.\n" +
    "실시간 연동을 위해 .env 파일에 Firebase 설정을 구성해 주세요."
  );
}

export { db, isConfigured };
export default db;
