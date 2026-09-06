// ============================================================
// story.js — กด "ตอนที่..." เพื่อขยาย/ย่ออ่านเนื้อเรื่อง (เฉพาะตอนที่ปลดล็อกแล้ว)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const unlockedEpisodes = document.querySelectorAll(".story-episode.unlocked");

    unlockedEpisodes.forEach((ep) => {
        const header = ep.querySelector(".story-episode-header");
        if (!header) return;

        header.addEventListener("click", () => {
            ep.classList.toggle("open");
        });
    });
});
