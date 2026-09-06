// ============================================================
// auth-guard.js — ล็อกหน้านี้ไว้ ต้อง login ก่อนถึงจะเข้าดูได้
// ต้องโหลดคู่กับ css/auth-guard.css และหลัง js/firebase-config.js เสมอ
// ห้ามใส่ในหน้า login.html (จะเข้าหน้า login ไม่ได้เลย)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    // แสดงหน้าจอโหลดเต็มจอระหว่างเช็คสถานะ login
    const loader = document.createElement("div");
    loader.id = "auth-guard-loader";
    loader.innerHTML = `
        <div class="auth-guard-spinner"></div>
        <div>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</div>
    `;
    document.body.prepend(loader);
});

auth.onAuthStateChanged((user) => {
    const loader = document.getElementById("auth-guard-loader");

    if (!user) {
        // ยังไม่ได้เข้าสู่ระบบ → พาไปหน้า login พร้อมจดจำหน้าที่ต้องการกลับมาดูทีหลัง
        const nextUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = "login.html?next=" + nextUrl;
        return;
    }

    // เข้าสู่ระบบแล้ว → เปิดให้เห็นเนื้อหาหน้านี้
    document.documentElement.classList.add("auth-ready");
    if (loader) loader.remove();
});
