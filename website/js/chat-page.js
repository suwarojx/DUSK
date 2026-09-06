// ============================================================
// chat-page.js — ตรรกะของหน้าแชทบอทเต็มจอ
// ใช้ Worker/API เดียวกับวิดเจ็ตเดิม แค่เปลี่ยนหน้าตาเป็นเต็มจอ
// ============================================================

const CHAT_API_URL = "https://dusk-chatbot.suwarojggez.workers.dev/";

const SERVER_CONTEXT = `
คุณคือแอดมินผู้ช่วยของเซิร์ฟเวอร์ Minecraft Roleplay ชื่อ "DUSK - The Dusky Duck Community"
ข้อมูลเซิร์ฟเวอร์:
- IP เซิร์ฟเวอร์: play.dusk-mc.com
- Discord: https://discord.gg/CHJv92x4Cu
- กฎเซิร์ฟเวอร์ดูได้จากลิงก์ในเมนู "กฎเซิร์ฟเวอร์" บนเว็บไซต์
- เซิร์ฟเวอร์มีระบบอาชีพสมจริง (ตำรวจ หมอ ประชาชน) ระบบเศรษฐกิจ ระบบอสังหาริมทรัพย์ และกิจกรรมประจำสัปดาห์
- ผู้เล่นใหม่ต้องสอบ Whitelist ก่อนถึงจะเข้าเล่นได้

หน้าที่ของคุณ: ตอบคำถามของลูกโรล (ผู้เล่น) เกี่ยวกับกฎเซิร์ฟเวอร์ วิธีติดตั้ง การสอบ Whitelist และข้อมูลทั่วไปของเซิร์ฟเวอร์
ตอบด้วยน้ำเสียงเป็นกันเอง สุภาพ กระชับ เป็นภาษาไทย
หากไม่แน่ใจคำตอบ หรือเป็นเรื่องที่ต้องให้แอดมินจริงตัดสิน ให้แนะนำให้ไปแจ้ง Ticket ในดิสคอร์ดแทน อย่าเดาคำตอบเอง
`.trim();

document.addEventListener("DOMContentLoaded", () => {
    const messagesBox = document.getElementById("cp-messages");
    const input = document.getElementById("cp-input");
    const sendBtn = document.getElementById("cp-send");
    const suggestBtns = document.querySelectorAll(".cp-suggest-btn");

    let history = [];

    // ปรับความสูง textarea ให้ยืดตามข้อความ
    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 160) + "px";
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    suggestBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            input.value = btn.textContent;
            sendMessage();
        });
    });

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        const suggestRow = document.getElementById("cp-suggestions");
        if (suggestRow) suggestRow.remove();

        addBubble(text, "user");
        history.push({ role: "user", content: text });
        input.value = "";
        input.style.height = "auto";

        const typingEl = addBubble("กำลังพิมพ์...", "bot typing");

        try {
            const res = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-10),
                    serverContext: SERVER_CONTEXT
                })
            });

            if (!res.ok) throw new Error("API error " + res.status);
            const data = await res.json();
            const reply = data.reply || "ขออภัย ไม่สามารถตอบคำถามได้ในขณะนี้";

            typingEl.remove();
            addBubble(reply, "bot");
            history.push({ role: "assistant", content: reply });

        } catch (err) {
            typingEl.remove();
            addBubble("⚠️ เชื่อมต่อระบบแชทบอทไม่สำเร็จ ลองใหม่อีกครั้ง หรือแจ้ง Ticket ในดิสคอร์ดแทนนะ", "bot");
            console.error("Chatbot error:", err);
        }
    }

    function addBubble(text, cls) {
        const el = document.createElement("div");
        el.className = "cp-msg " + cls;
        el.textContent = text;
        messagesBox.appendChild(el);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return el;
    }
});
