// ============================================================
// mobile-nav.js — เพิ่มปุ่มแฮมเบอร์เกอร์และเปิด/ปิดเมนูบนมือถือ
// ทำงานร่วมกับ css/responsive.css (ต้องโหลดคู่กันทุกหน้า)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const navContainer = document.querySelector(".nav-container");
    const navLinks = document.querySelector(".nav-links");
    if (!navContainer || !navLinks) return;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "nav-toggle-btn";
    toggleBtn.setAttribute("aria-label", "เปิดเมนู");
    toggleBtn.innerHTML = "☰";

    navContainer.insertBefore(toggleBtn, navContainer.firstChild);

    toggleBtn.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("nav-open");
        toggleBtn.innerHTML = isOpen ? "✕" : "☰";
    });

    // ปิดเมนูอัตโนมัติเมื่อกดลิงก์ใดๆ ในเมนู (มือถือ)
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("nav-open");
            toggleBtn.innerHTML = "☰";
        });
    });
});
