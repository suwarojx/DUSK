// ============================================================
// chatbot.js — วิดเจ็ตแชทบอทตอบคำถามลูกโรล (เชื่อมกับ AI จริง)
// ============================================================
//
// วิธีติดตั้ง:
// 1. Deploy ไฟล์ worker/chat-worker.js ขึ้น Cloudflare Workers (ฟรี)
//    แล้วเอา URL ที่ได้มาใส่ตรง CHAT_API_URL ด้านล่าง
// 2. แก้ไขข้อมูลเซิร์ฟเวอร์ใน SERVER_CONTEXT ให้ตรงกับเซิร์ฟเวอร์จริงของนาย
//    (บอทจะใช้ข้อมูลตรงนี้ตอบคำถามลูกโรล)
//
// ============================================================

const CHAT_API_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";

// ข้อมูลเซิร์ฟเวอร์ที่จะส่งให้ AI ใช้ตอบคำถาม แก้ตรงนี้ให้ตรงกับเซิร์ฟเวอร์จริง
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
    injectWidget();

    const toggleBtn = document.getElementById("dusk-chat-toggle");
    const chatWindow = document.getElementById("dusk-chat-window");
    const closeBtn = document.getElementById("dusk-chat-close");
    const sendBtn = document.getElementById("dusk-chat-send");
    const input = document.getElementById("dusk-chat-input");
    const messages = document.getElementById("dusk-chat-messages");

    let history = [];

    toggleBtn.addEventListener("click", () => {
        chatWindow.classList.toggle("open");
    });
    closeBtn.addEventListener("click", () => {
        chatWindow.classList.remove("open");
    });

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addBubble(text, "user");
        history.push({ role: "user", content: text });
        input.value = "";

        const typingEl = addBubble("กำลังพิมพ์...", "bot typing");

        try {
            const res = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-10), // ส่งประวัติแค่ 10 ข้อความล่าสุดพอ
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
        el.className = "dusk-msg " + cls;
        el.textContent = text;
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
        return el;
    }

    function injectWidget() {
        const toggle = document.createElement("button");
        toggle.id = "dusk-chat-toggle";
        toggle.innerHTML = "💬";
        toggle.setAttribute("aria-label", "เปิดแชทบอท");

        const win = document.createElement("div");
        win.id = "dusk-chat-window";
        win.innerHTML = `
            <div class="dusk-chat-header">
                <div>
                    <h4>🦆 DUSK Bot</h4>
                    <span>ผู้ช่วยตอบคำถามลูกโรล</span>
                </div>
                <button id="dusk-chat-close">✕</button>
            </div>
            <div id="dusk-chat-messages">
                <div class="dusk-msg bot">สวัสดีครับ! มีอะไรให้ช่วยเกี่ยวกับเซิร์ฟเวอร์ DUSK ไหมครับ 🦆</div>
            </div>
            <div id="dusk-chat-input-row">
                <textarea id="dusk-chat-input" rows="1" placeholder="พิมพ์คำถาม..."></textarea>
                <button id="dusk-chat-send">➤</button>
            </div>
        `;

        document.body.appendChild(toggle);
        document.body.appendChild(win);
    }
});
