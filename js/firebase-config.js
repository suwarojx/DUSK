// ============================================================
// firebase-config.js
// ค่า Firebase Project ของเว็บ DUSK (dusk-a6a76)
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyDPgZYBA3_ksvjvMHTTGenpIfXrLss9vVE",
  authDomain: "dusk-a6a76.firebaseapp.com",
  projectId: "dusk-a6a76",
  storageBucket: "dusk-a6a76.firebasestorage.app",
  messagingSenderId: "419498582819",
  appId: "1:419498582819:web:b878564ec103eb019da296"
};

// เริ่มต้นใช้งาน Firebase (ใช้ SDK แบบ compat เพื่อความง่าย ไม่ต้องใช้ build tool)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// storage ใช้เฉพาะหน้าที่โหลด firebase-storage-compat.js เพิ่ม (เช่น profile.html)
// เช็คก่อนเรียกใช้ เพื่อไม่ให้หน้าอื่นที่ไม่ได้โหลด SDK ตัวนี้ error
const storage = firebase.storage ? firebase.storage() : null;
