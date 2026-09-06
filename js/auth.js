// ============================================================
// auth.js
// จัดการระบบ Login / Register / Logout ด้วย Firebase Authentication
// ============================================================

// ---------- สมัครสมาชิก ----------
async function registerUser(username, email, password) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    // เก็บ username แยกไว้ใน Firestore เพราะ Firebase Auth ไม่มีช่อง username ให้โดยตรง
    await db.collection("users").doc(cred.user.uid).set({
      username: username,
      email: email,
      role: "player",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await cred.user.updateProfile({ displayName: username });
    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, message: mapFirebaseError(err.code) };
  }
}

// ---------- เข้าสู่ระบบ ----------
async function loginUser(email, password) {
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, message: mapFirebaseError(err.code) };
  }
}

// ---------- ออกจากระบบ ----------
function logoutUser() {
  return auth.signOut();
}

// ---------- แปล error code ของ Firebase เป็นภาษาไทย ----------
function mapFirebaseError(code) {
  const map = {
    "auth/email-already-in-use": "อีเมลนี้ถูกใช้สมัครไปแล้ว",
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
    "auth/weak-password": "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)",
    "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/too-many-requests": "พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง"
  };
  return map[code] || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

// ---------- อัปเดตปุ่ม Login/Logout บน navbar ทุกหน้า ----------
// ต้องมี <div id="auth-nav-slot"></div> วางไว้ใน nav ของแต่ละหน้า
function renderAuthNav(user) {
  const slot = document.getElementById("auth-nav-slot");
  if (!slot) return;

  if (user) {
    const name = user.displayName || user.email;
    slot.innerHTML = `
      <div class="auth-user-box">
        <span class="auth-user-name">👤 ${name}</span>
        <button id="logout-btn" class="btn-outline auth-logout-btn">ออกจากระบบ</button>
      </div>`;
    document.getElementById("logout-btn").addEventListener("click", () => {
      logoutUser();
    });
  } else {
    slot.innerHTML = `<a href="login.html" class="btn-glow-small auth-login-link">เข้าสู่ระบบ</a>`;
  }
}

auth.onAuthStateChanged((user) => {
  renderAuthNav(user);
});
