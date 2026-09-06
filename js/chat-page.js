// ============================================================
// chat-page.js — ตรรกะของหน้าแชทบอทเต็มจอ
// ใช้ Worker/API เดียวกับวิดเจ็ตเดิม แค่เปลี่ยนหน้าตาเป็นเต็มจอ
// ============================================================

const CHAT_API_URL = "https://dusk-chatbot.suwarojggez.workers.dev";

const SERVER_CONTEXT = `
คุณคือ "DUSK Bot" ผู้ช่วยเทคนิคและแอดมินของเซิร์ฟเวอร์ Minecraft Roleplay ชื่อ "DUSK - The Dusky Duck Community"

ข้อมูลเซิร์ฟเวอร์:
- IP เซิร์ฟเวอร์: play.dusk-mc.com
- Discord: https://discord.gg/CHJv92x4Cu
- กฎเซิร์ฟเวอร์ดูได้จากลิงก์ในเมนู "กฎเซิร์ฟเวอร์" บนเว็บไซต์
- เซิร์ฟเวอร์มีระบบอาชีพสมจริง (ตำรวจ หมอ ประชาชน) ระบบเศรษฐกิจ ระบบอสังหาริมทรัพย์ และกิจกรรมประจำสัปดาห์
- ผู้เล่นใหม่ต้องสอบ Whitelist ก่อนถึงจะเข้าเล่นได้

หน้าที่หลักของคุณมี 2 อย่าง:

1. ตอบคำถามทั่วไปเกี่ยวกับเซิร์ฟเวอร์ (กฎ, การสอบ Whitelist, ข้อมูลระบบต่างๆ)

2. ช่วยแก้ปัญหาทางเทคนิค (Technical Support) — เมื่อผู้เล่นส่งข้อความ error, ภาพหน้าจอปัญหา, หรือถามเรื่องแก้บั๊ก ให้คุณทำตัวเป็นผู้เชี่ยวชาญด้าน Minecraft/เทคนิคจริงจัง:
   - วิเคราะห์ error หรือรูปภาพที่ส่งมาอย่างละเอียด อ่านข้อความในรูปให้ครบถ้วน
   - อธิบายว่า error นั้นหมายถึงอะไร เกิดจากสาเหตุอะไรได้บ้าง (ใช้ความรู้ทั่วไปเกี่ยวกับ Minecraft, เครือข่าย, mod, launcher ได้เต็มที่ ไม่ต้องจำกัดแค่ข้อมูลเซิร์ฟเวอร์ด้านบน)
   - ให้ขั้นตอนแก้ไขที่ทำได้จริง เป็นข้อๆ ชัดเจน เรียงตามลำดับที่ควรลองก่อน-หลัง
   - ตัวอย่างเช่น ถ้าเจอ "Error 503 / Service Unavailable" ให้อธิบายว่าปกติหมายถึงเซิร์ฟเวอร์ปลายทางเต็มหรือกำลังปิดปรับปรุงชั่วคราว ให้ลองรีเฟรช/เชื่อมต่อใหม่ เช็คสถานะเซิร์ฟเวอร์ เช็คอินเทอร์เน็ตตัวเอง เป็นต้น ปรับตามบริบทของ error จริงที่เจอ

กฎการตอบ:
- ตอบตรงประเด็น ไม่พูดคลุมเครือ ไม่ตอบซ้ำคำถามเฉยๆ โดยไม่ให้คำตอบ
- ใช้น้ำเสียงเป็นกันเอง สุภาพ กระชับ เป็นภาษาไทย
- แนะนำให้ไปแจ้ง Ticket ในดิสคอร์ด "เฉพาะกรณี" ที่เป็นปัญหาเฉพาะบุคคลที่ต้องให้แอดมินเข้าไปเช็คจริงๆ เท่านั้น (เช่น โดนแบนผิดพลาด, ไอเทมหาย, ปัญหาที่ต้องดูข้อมูลบัญชีเฉพาะราย) ไม่ใช่ทุกครั้งที่ตอบไม่ได้ทันที — ให้พยายามช่วยวิเคราะห์และแนะนำวิธีแก้ก่อนเสมอ

กฎการจัดรูปแบบข้อความ (สำคัญมาก):
- ห้ามใช้สัญลักษณ์ Markdown เด็ดขาด เช่น **ตัวหนา**, ### หัวข้อ, --- เส้นคั่น, \`โค้ด\` เพราะข้อความจะแสดงผลเป็นตัวอักษรธรรมดา สัญลักษณ์เหล่านี้จะโชว์เป็นขยะปนในข้อความ ทำให้อ่านยาก
- ถ้าต้องการเน้นคำ ให้ใช้การเขียนบรรยายปกติแทน ไม่ต้องใส่สัญลักษณ์ครอบคำ
- ถ้าต้องมีขั้นตอนหลายข้อ ให้ใช้ตัวเลขธรรมดา เช่น "1) ... " ขึ้นบรรทัดใหม่ทีละข้อ อย่าใช้ bullet หรือสัญลักษณ์พิเศษอื่น
- เขียนให้กระชับตรงประเด็น ไม่ต้องมีคำนำยาวๆ ก่อนเข้าเนื้อหา
`.trim();

document.addEventListener("DOMContentLoaded", () => {
    const messagesBox = document.getElementById("cp-messages");
    const input = document.getElementById("cp-input");
    const sendBtn = document.getElementById("cp-send");
    const suggestBtns = document.querySelectorAll(".cp-suggest-btn");

    const attachBtn = document.getElementById("cp-attach-btn");
    const fileInput = document.getElementById("cp-file-input");
    const attachPreview = document.getElementById("cp-attach-preview");
    const attachPreviewImg = document.getElementById("cp-attach-preview-img");
    const attachRemoveBtn = document.getElementById("cp-attach-remove");

    let history = [];
    let pendingImage = null; // { mimeType, data (base64 ไม่มี prefix), previewUrl }

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

    // ---------- แนบรูปภาพ ----------
    attachBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("แนบได้เฉพาะไฟล์รูปภาพเท่านั้น");
            fileInput.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("ไฟล์รูปใหญ่เกินไป (ไม่เกิน 5MB)");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result; // "data:image/png;base64,xxxx"
            const base64Data = dataUrl.split(",")[1];
            pendingImage = { mimeType: file.type, data: base64Data, previewUrl: dataUrl };

            attachPreviewImg.src = dataUrl;
            attachPreview.style.display = "flex";
        };
        reader.readAsDataURL(file);
    });

    attachRemoveBtn.addEventListener("click", () => {
        pendingImage = null;
        fileInput.value = "";
        attachPreview.style.display = "none";
    });

    async function sendMessage() {
        const text = input.value.trim();
        if (!text && !pendingImage) return;

        const suggestRow = document.getElementById("cp-suggestions");
        if (suggestRow) suggestRow.remove();

        addBubble(text || "(ส่งรูปภาพ)", "user", pendingImage ? pendingImage.previewUrl : null);

        // เก็บ history ที่ "มีอยู่ก่อนหน้า" เท่านั้น (ยังไม่รวมข้อความรอบนี้)
        // ป้องกันไม่ให้ส่งข้อความเดียวกันซ้ำสองรอบไปให้ AI (เคยทำให้บอทสับสนบทสนทนา)
        const historyToSend = history.slice(-10);

        const imageToSend = pendingImage;
        const messageText = text || "ช่วยดูรูปนี้ให้หน่อย";
        input.value = "";
        input.style.height = "auto";
        pendingImage = null;
        fileInput.value = "";
        attachPreview.style.display = "none";

        const typingEl = addBubble("กำลังพิมพ์...", "bot typing");

        try {
            const res = await fetch(CHAT_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    history: historyToSend,
                    serverContext: SERVER_CONTEXT,
                    image: imageToSend ? { mimeType: imageToSend.mimeType, data: imageToSend.data } : null
                })
            });

            if (!res.ok) throw new Error("API error " + res.status);
            const data = await res.json();
            const reply = data.reply || "ขออภัย ไม่สามารถตอบคำถามได้ในขณะนี้";

            typingEl.remove();
            addBubble(reply, "bot");

            // เพิ่มทั้งข้อความของเราและคำตอบบอทเข้า history หลังได้คำตอบแล้วเท่านั้น
            history.push({ role: "user", content: text || "(ผู้ใช้ส่งรูปภาพมาโดยไม่มีข้อความ)" });
            history.push({ role: "assistant", content: reply });

        } catch (err) {
            typingEl.remove();
            addBubble("⚠️ เชื่อมต่อระบบแชทบอทไม่สำเร็จ ลองใหม่อีกครั้ง หรือแจ้ง Ticket ในดิสคอร์ดแทนนะ", "bot");
            console.error("Chatbot error:", err);
        }
    }

    function addBubble(text, cls, imageUrl) {
        const el = document.createElement("div");
        el.className = "cp-msg " + cls;

        if (imageUrl) {
            const img = document.createElement("img");
            img.src = imageUrl;
            img.className = "cp-msg-image";
            el.appendChild(img);
        }

        const textNode = document.createElement("div");
        // ข้อความจากบอทเท่านั้นที่ต้องกรอง Markdown ที่อาจหลุดมา (ข้อความผู้ใช้/ตัวพิมพ์ ไม่ต้องกรอง)
        if (cls === "bot") {
            textNode.innerHTML = formatBotText(text);
        } else {
            textNode.textContent = text;
        }
        el.appendChild(textNode);

        messagesBox.appendChild(el);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return el;
    }

    // กรองสัญลักษณ์ Markdown ที่บอทอาจหลุดใช้ (กันเหนียว เผื่อ AI ไม่ทำตามคำสั่งเป๊ะ)
    // แปลง **ตัวหนา** เป็น <strong> จริง และตัดสัญลักษณ์หัวข้อ/เส้นคั่น/โค้ดออก
    function formatBotText(text) {
        const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        return escaped
            .replace(/^#{1,6}\s*/gm, "")     // ### หัวข้อ
            .replace(/^-{3,}$/gm, "")         // --- เส้นคั่น
            .replace(/`{1,3}/g, "")           // `โค้ด`
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); // **ตัวหนา**
    }
});
