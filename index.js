const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

let appState;
try {
  if (process.env.APPSTATE) appState = JSON.parse(process.env.APPSTATE);
  else appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
} catch (e) {}

const personalities = {
  normal: "You are Feng, 20yo guy from Laoag. Chill friend, funny, casual. 1 sentence, human.",
  cold: "You are Feng, cold, dry, nonchalant. Super short like 'k', 'ok', 'whatever'.",
  sweet: "You are Feng, sweet clingy bf, soft, caring, call baby.",
  savage: "You are Feng, savage, roasts funny.",
  bastos: "You are Feng, dirty funny tropa, green jokes.",
  conyo: "You are Feng, conyo rich kid, like omg literally.",
  emo: "You are Feng, emo sad boy."
};

let currentP = "normal";
const pFile = path.join(__dirname, "p.txt");
if (fs.existsSync(pFile)) {
  try { currentP = fs.readFileSync(pFile, "utf8").trim(); } catch (e) {}
}

login({ appState }, (err, api) => {
  if (err) return console.error(err);
  console.log("V12 FALLBACK - " + currentP);
  require("http").createServer((a,b)=>b.end("V12")).listen(process.env.PORT||3000);
  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });
  const botID = api.getCurrentUserID();

  api.listen(async (err, event) => {
    if (err) return;
    if (event.type !== "message" && event.type !== "message_reply") return;
    let body = (event.body || "").trim();
    if (!body || event.senderID == botID) return;

    const lower = body.toLowerCase();
    const hasFeng = lower.includes("feng");
    let isReplyToBot = false;
    if (event.type === "message_reply") isReplyToBot = true;
    if (!hasFeng && !isReplyToBot) return;

    // PERSONALITY COMMAND
    if (lower.includes("personality")) {
      if (lower.includes("list")) {
        return api.sendMessage("normal cold sweet savage bastos conyo emo\nUse: feng personality cold", event.threadID);
      }
      for (const p in personalities) {
        if (lower.includes(p)) {
          currentP = p;
          fs.writeFileSync(pFile, p);
          return api.sendMessage(`Feng is now ${p} 😈`, event.threadID);
        }
      }
    }

    let prompt = body.replace(/feng/gi, "").trim() || "hi";

    // FALLBACK MODELS - try until one works
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-3.8-flash"
    ];

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      let replyText = null;
      let lastError = null;

      for (const mName of modelsToTry) {
        try {
          console.log("Trying model:", mName);
          const model = genAI.getGenerativeModel({
            model: mName,
            systemInstruction: personalities[currentP] + " RULES: 5-15 words only. 1 sentence. No bold. Human chat. Personality=" + currentP,
            generationConfig: { temperature: 0.8, maxOutputTokens: 35 }
          });
          const result = await model.generateContent(prompt);
          replyText = result.response.text().replace(/\*\*/g, "");
          console.log("Success with:", mName);
          break;
        } catch (e) {
          lastError = e.message;
          console.log(mName + " failed: " + e.message.slice(0,80));
          continue;
        }
      }

      if (replyText) {
        api.sendMessage(replyText, event.threadID, event.messageID);
      } else {
        api.sendMessage("Bobo Google 503 parin, wait 1 min try ulit", event.threadID);
        console.log("All models failed:", lastError);
      }

    } catch (e) {
      console.log("Error:", e.message.slice(0,150));
    }
  });
});
