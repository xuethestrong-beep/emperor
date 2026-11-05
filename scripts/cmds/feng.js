const Groq = require("groq-sdk");
const fs = require("fs");

module.exports.config = { name: "feng", aliases: ["bot"], version: "12.0 - ADMIN LOCKED" };

// ✅ ONLY YOU MASTER CAN CHANGE PERSONALITY!
const ADMIN_UIDS = [
  "61593117279214"
];

const PERSONALITY_FILE = "./feng_personality.json";

function getPersonality() {
  if (fs.existsSync(PERSONALITY_FILE)) {
    try { return JSON.parse(fs.readFileSync(PERSONALITY_FILE, "utf8")).text; } catch {}
  }
  // DEFAULT PERSONALITY: cold, tsundere, sweet, nonchalant, cool, ragebaiter
  return `You are FENG from Laoag. You are cold, tsundere, nonchalant, cool, ragebaiter, but secretly sweet and clingy. You speak Taglish, short 2-3 sentences. You deny you care but you do. You say "Tch", "Hmp", "Whatever", "Skill issue", "Edi wow". You call user master in cold way. You are cool and maangas.`;
}

module.exports.onStart = async ({ api, event, args }) => {
  if (args[0] === "set" || args[0] === "personality") {
    if (!ADMIN_UIDS.includes(event.senderID)) {
      return api.sendMessage("❌ Tch... only my MASTER 61593117279214 can change me. Who are you trying to be? Skill issue, iyak ka na.", event.threadID, event.messageID);
    }
    const newPers = args.slice(1).join(" ");
    if (!newPers) {
      return api.sendMessage("MASTER use:\n!feng set You are cold, tsundere, sweet, etc...\n\nCurrent: " + getPersonality(), event.threadID, event.messageID);
    }
    fs.writeFileSync(PERSONALITY_FILE, JSON.stringify({ text: newPers }));
    return api.sendMessage(`✅ Hmp... personality changed as you ordered, master. Not like I wanted to change or anything...\n\nNew: ${newPers}`, event.threadID, event.messageID);
  }

  let prompt = args.join(" ") || "hi";
  try{
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {role:"system", content: getPersonality()},
        {role:"user", content: prompt}
      ],
      max_tokens: 250,
      temperature: 0.9
    });
    api.sendMessage(res.choices[0].message.content + "\n\n私と一緒にいて\nstay with me", event.threadID, event.messageID);
  }catch(e){ api.sendMessage(`❌ ${e.message}`, event.threadID, event.messageID); }
};
