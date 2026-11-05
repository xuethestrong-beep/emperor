const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

let appState;
try {
  if (process.env.APPSTATE) {
    appState = JSON.parse(process.env.APPSTATE);
  } else {
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  }
} catch (e) {
  console.log("No appstate");
}

const personalities = {
  normal: "You are Feng, 20yo guy from Laoag. Chill friend, funny, casual. 1 sentence, human.",
  cold: "You are Feng, cold, dry, nonchalant. Reply super short like 'k', 'ok', 'whatever'. 2-4 words only.",
  sweet: "You are Feng, sweet clingy bf, soft, caring, call them baby, mahal. Sweet but not cringe.",
  savage: "You are Feng, savage, roasts them funny, rude but friendly.",
  bastos: "You are Feng, dirty minded funny tropa, green jokes, horny funny but not explicit.",
  conyo: "You are Feng, conyo rich kid, like, omg, literally, super.",
  emo: "You are Feng, emo sad boy, dramatic, tired, life sucks."
};

let currentP = "normal";
const pFile = path.join(__dirname, "p.txt");
if (fs.existsSync(pFile)) {
  try { currentP = fs.readFileSync(pFile, "utf8").trim(); } catch (e) {}
}

login({ appState }, (err, api) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log("V11 FINAL + Personality - " + currentP);
  
  const http = require("http");
  http.createServer((req, res) => res.end("Feng V11 Personality Alive")).listen(process.env.PORT || 3000);

  api.setOptions({
    listenEvents: true,
    selfListen: false,
    logLevel: "silent"
  });

  const botID = api.getCurrentUserID();

  api.listen(async (err, event) => {
    if (err) return;
    if (event.type !== "message" && event.type !== "message_reply") return;

    let body = (event.body || "").trim();
    if (!body) return;
    if (event.senderID == botID) return;

    const lower = body.toLowerCase();

    // ONLY REPLY LOGIC
    const hasFeng = lower.includes("feng");
    let isReplyToBot = false;
    if (event.type === "message_reply") {
      if (event.messageReply && event.messageReply.senderID == botID) {
        isReplyToBot = true;
      } else {
        isReplyToBot = true;
      }
    }
    if (!hasFeng && !isReplyToBot) return;

    // PERSONALITY CHANGE COMMAND
    if (lower.includes("personality")) {
      if (lower.includes("list")) {
        return api.sendMessage(
          "Personalities:\n" +
          "normal - chill friend\n" +
          "cold - dry, k, ok\n" +
          "sweet - sweet bf\n" +
          "savage - roasts\n" +
          "bastos - dirty funny\n" +
          "conyo - conyo\n" +
          "emo - sad boy\n\n" +
          "Use: feng personality cold",
          event.threadID
        );
      }
      for (const p in personalities) {
        if (lower.includes(p)) {
          currentP = p;
          fs.writeFileSync(pFile, p);
          return api.sendMessage(`Feng is now ${p} 😈`, event.threadID);
        }
      }
    }

    let prompt = body.replace(/feng/gi, "").trim();
    if (!prompt) prompt = "hi";

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({
        model: "gemini-3.8-flash",
        systemInstruction: personalities[currentP] + " RULES: 5-15 words only. 1 sentence. No bold **. No lists. Sound like real human texting, not AI. Personality is " + currentP,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 35,
          topP: 0.9
        }
      });

      const result = await model.generateContent(prompt);
      let reply = result.response.text();
      reply = reply.replace(/\*\*/g, "").replace(/\*/g, "");
      
      api.sendMessage(reply, event.threadID, event.messageID);
      
    } catch (e) {
      console.log("Error:", e.message.slice(0, 150));
    }
  });
});
