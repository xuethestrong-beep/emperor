const fs = require("fs");
const path = require("path");
const DISABLED_FILE = path.join(__dirname, "cache", "disabled.json");
function isDisabled() {
  try {
    if (fs.existsSync(DISABLED_FILE)) {
      const list = JSON.parse(fs.readFileSync(DISABLED_FILE, "utf8"));
      return list.includes("noprefix");
    }
  } catch {} return false;
}
module.exports.config = {
  name: "noprefix",
  version: "TENG TRIGGER - TENGTENG👍🏿",
  role: 0,
  description: "Auto chat when says teng"
};
module.exports.onChat = async ({ api, event, groq }) => {
  try {
    const { threadID, messageID, senderID, body } = event;
    if (!body) return;
    if (body.startsWith("!")) return;
    if (isDisabled()) return;
    if (String(senderID) === String(api.getCurrentUserID())) return;
    const text = body.trim();
    if (text.length < 1 || text.length > 500) return;
    
    // ===== TRIGGER ONLY WHEN SAYS "TENG" =====
    const lower = text.toLowerCase();
    const isTriggered = lower.includes("teng") || lower.includes("tang") || event.mentions && Object.keys(event.mentions).length > 0 || event.type === "message_reply" && event.messageReply?.senderID == api.getCurrentUserID();
    
    if (!isTriggered) return;
    
    if (!groq) return;
    const systemPrompt = `You are TENGTENG👍🏿 - super friendly funny bestie! Owner: TENGTENG. Personality: playful, Gen Z, supportive, uses emojis 😆✨. When user says "teng", reply like bestie, funny, short 1-3 sentences. Understand Tagalog, English, Bisaya, Bangla - reply same language user uses. Never say you are Meta AI or LUMA, you are TENGTENG👍🏿. Add 1-2 emojis.`;
    let userName = "bestie";
    try { const info = await api.getUserInfo(senderID); userName = info[senderID]?.name?.split(" ")[0] || "bestie"; } catch {}
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${userName} says: ${text}` }],
      max_tokens: 150,
      temperature: 0.9,
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return;
    api.sendMessage(reply, threadID, messageID);
    try { api.setMessageReaction("😆", messageID, threadID, () => {}); } catch {}
  } catch (e) { console.log("[NOPREFIX ERROR]", e.message); }
};
module.exports.onStart = async () => {};
