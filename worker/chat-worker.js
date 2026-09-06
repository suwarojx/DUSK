// ============================================================
// chat-worker.js
// Cloudflare Worker — ตัวกลางระหว่างเว็บกับ Gemini API (ฟรี)
// เก็บ API Key ไว้ฝั่งเซิร์ฟเวอร์ ไม่ให้หลุดไปอยู่ใน JS หน้าเว็บ
//
// วิธี Deploy:
// 1. สมัคร Cloudflare (ฟรี) ที่ https://dash.cloudflare.com
// 2. ไปที่ Workers & Pages > Create > Create Worker
// 3. วางโค้ดนี้ทั้งหมดแทนโค้ดเริ่มต้น แล้วกด Deploy
// 4. ไปที่ Settings > Variables and Secrets ของ Worker นี้
//    เพิ่ม Secret ชื่อ GEMINI_API_KEY ใส่ค่า API Key ของนาย
//    (ขอ API Key ฟรีได้ที่ https://aistudio.google.com/apikey
//     ไม่ต้องผูกบัตรเครดิต กด "Create API Key" ได้เลย)
// 5. คัดลอก URL ของ Worker (เช่น https://xxx.yyy.workers.dev)
//    ไปใส่ที่ CHAT_API_URL ในไฟล์ js/chat-page.js
// 6. แก้ CORS_ALLOW_ORIGIN ด้านล่างเป็นโดเมนเว็บจริงของนาย เพื่อความปลอดภัย
// ============================================================

const CORS_ALLOW_ORIGIN = "*"; // แนะนำให้เปลี่ยนเป็น "https://dusk-mc.com" หลัง deploy จริง

// โมเดลฟรีของ Gemini (อัปเดตตามที่ Google แจ้งผ่าน error ล่าสุด)
// ถ้า Google เปลี่ยนชื่อโมเดลอีกในอนาคต ให้ดู error จาก Cloudflare Log แล้วแก้ชื่อตรงนี้
const GEMINI_MODEL = "gemini-3.6-flash";

export default {
  async fetch(request, env) {
    // จัดการ CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const { message, history = [], serverContext = "", image = null } = await request.json();

      if (!message || typeof message !== "string") {
        return jsonResponse({ error: "message is required" }, 400);
      }

      // แปลง history ให้เป็นรูปแบบที่ Gemini API ต้องการ
      // Gemini ใช้ role "user" กับ "model" (ไม่ใช่ "assistant" แบบ Anthropic/OpenAI)
      const contents = history
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      // ข้อความล่าสุด แนบรูปภาพด้วยถ้ามี (Gemini รองรับวิเคราะห์รูปได้ในตัว)
      const latestParts = [{ text: message }];
      if (image && image.data && image.mimeType) {
        latestParts.push({
          inline_data: {
            mime_type: image.mimeType,
            data: image.data
          }
        });
      }
      contents.push({ role: "user", parts: latestParts });

      const systemPrompt = serverContext || "คุณคือผู้ช่วยตอบคำถามของเซิร์ฟเวอร์ Minecraft Roleplay ตอบเป็นภาษาไทยอย่างสุภาพและกระชับ";

      // ส่ง API Key ผ่าน query parameter ?key= แทน header
      // (รองรับกว้างกว่าและตรงกับตัวอย่างทางการของ Google มากกว่าแบบ header)
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

      const apiRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents,
          generationConfig: {
            // เผื่อโควต้าให้เยอะพอสำหรับคำตอบยาวๆ แบบมีขั้นตอนหลายข้อ
            maxOutputTokens: 3000
          }
        })
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("Gemini API error:", errText);
        return jsonResponse({ error: "AI service error" }, 502);
      }

      const data = await apiRes.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        || "ขออภัย ไม่สามารถตอบคำถามได้ในขณะนี้";

      return jsonResponse({ reply });

    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse({ error: "Internal error" }, 500);
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}
