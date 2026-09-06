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

// ---------- เข้าสู่ระบบด้วย Google ----------
async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await auth.signInWithPopup(provider);

    // ถ้าเป็นผู้ใช้ใหม่ (สมัครครั้งแรกผ่าน Google) ให้สร้างข้อมูลใน Firestore ด้วย
    const userDoc = await db.collection("users").doc(cred.user.uid).get();
    if (!userDoc.exists) {
      await db.collection("users").doc(cred.user.uid).set({
        username: cred.user.displayName || cred.user.email,
        email: cred.user.email,
        role: "player",
        provider: "google",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    return { success: true, user: cred.user };
  } catch (err) {
    return { success: false, message: mapFirebaseError(err.code) };
  }
}

// ---------- ออกจากระบบ ----------
function logoutUser() {
  return auth.signOut();
}

// ---------- อัปโหลดรูปโปรไฟล์จากเครื่อง ----------
async function uploadProfilePhoto(file) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };

    if (!file.type.startsWith("image/")) {
      return { success: false, message: "กรุณาเลือกไฟล์รูปภาพเท่านั้น" };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "ไฟล์รูปใหญ่เกินไป (ไม่เกิน 5MB)" };
    }

    const ext = file.name.split(".").pop();
    const fileRef = storage.ref().child(`avatars/${user.uid}/profile.${ext}`);
    await fileRef.put(file);
    const downloadURL = await fileRef.getDownloadURL();

    await user.updateProfile({ photoURL: downloadURL });
    await db.collection("users").doc(user.uid).set({ photoURL: downloadURL }, { merge: true });

    return { success: true, url: downloadURL };
  } catch (err) {
    console.error("uploadProfilePhoto error:", err);
    return { success: false, message: "อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
}

// ---------- อัปเดตข้อมูลโปรไฟล์ (ชื่อผู้เล่น / รูปโปรไฟล์) ----------
async function updateUserProfile(username, photoURL) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };

    const updateData = {};
    if (username) updateData.displayName = username;
    if (photoURL) updateData.photoURL = photoURL;
    await user.updateProfile(updateData);

    // อัปเดตข้อมูลใน Firestore ด้วย ให้ตรงกัน
    await db.collection("users").doc(user.uid).set({
      username: username || user.displayName,
      photoURL: photoURL || user.photoURL || null
    }, { merge: true });

    return { success: true };
  } catch (err) {
    return { success: false, message: mapFirebaseError(err.code) };
  }
}

// ---------- เปลี่ยนรหัสผ่าน (ต้องยืนยันรหัสผ่านเดิมก่อน) ----------
async function changeUserPassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อน" };

    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);

    return { success: true };
  } catch (err) {
    return { success: false, message: mapFirebaseError(err.code) };
  }
}

// ---------- ดึงข้อมูลโปรไฟล์เพิ่มเติมจาก Firestore (เช่น วันที่สมัคร) ----------
async function getUserProfileData(uid) {
  try {
    const doc = await db.collection("users").doc(uid).get();
    return doc.exists ? doc.data() : null;
  } catch (err) {
    console.error("getUserProfileData error:", err);
    return null;
  }
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
    "auth/too-many-requests": "พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง",
    "auth/popup-closed-by-user": "ปิดหน้าต่างเข้าสู่ระบบก่อนทำรายการเสร็จ",
    "auth/cancelled-popup-request": "มีการเปิดหน้าต่างเข้าสู่ระบบซ้อนกัน ลองใหม่อีกครั้ง",
    "auth/account-exists-with-different-credential": "อีเมลนี้เคยสมัครด้วยวิธีอื่นไปแล้ว ลองเข้าสู่ระบบด้วยวิธีเดิม",
    "auth/requires-recent-login": "เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่อีกครั้งก่อนเปลี่ยนรหัสผ่าน"
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
        <a href="profile.html" class="auth-user-name">👤 ${name}</a>
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
