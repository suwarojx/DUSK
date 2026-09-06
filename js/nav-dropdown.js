// ============================================================
// nav-dropdown.js — จัดการเมนูย่อย (dropdown) บน navbar
// ต้องมี HTML โครงสร้าง:
// <li class="nav-dropdown">
//   <button class="nav-dropdown-toggle">เกี่ยวกับเซิร์ฟเวอร์ <span class="nav-dropdown-arrow">▾</span></button>
//   <ul class="nav-dropdown-menu"> ... <li><a>...</a></li> ... </ul>
// </li>
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll(".nav-dropdown");

    dropdowns.forEach((dropdown) => {
        const toggleBtn = dropdown.querySelector(".nav-dropdown-toggle");
        if (!toggleBtn) return;

        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains("open");

            // ปิด dropdown อื่นๆ ที่เปิดค้างอยู่ก่อน (เผื่อมีหลายอัน)
            dropdowns.forEach((d) => d.classList.remove("open"));

            if (!isOpen) {
                dropdown.classList.add("open");
            }
        });
    });

    // คลิกที่ไหนก็ได้นอกเมนู ให้ปิด dropdown ทั้งหมด
    document.addEventListener("click", () => {
        dropdowns.forEach((d) => d.classList.remove("open"));
    });
});
