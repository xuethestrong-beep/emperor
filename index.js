const fs = require("fs");
const path = require("path");

// AUTO FALLBACK - TRY ws3-fca FIRST, THEN fca-unofficial
let fca, login;
try {
  fca = require("ws3-fca");
  login = fca.default || fca.login || fca;
  console.log("Using: ws3-fca");
} catch(e) {
  fca = require("fca-unofficial");
  login = fca;
  console.log("Using: fca-unofficial");
}

let appState;
try {
  if (process.env.APPSTATE) {
    appState = JSON.parse(process.env.APPSTATE);
    console.log("APPSTATE from Railway ENV:", appState.length, "cookies");
  } else {
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
    console.log("APPSTATE from file:", appState.length, "cookies");
  }
} catch (e) {
  console.log("APPSTATE ERROR:", e.message);
  process.exit(1);
}

const personalities = {
  normal: "You are Feng, 20yo guy from Laoag, chill funny human, short 5-15 words, say haha lods gagi, Taglish, never say As an AI.",
  cold: "You are Feng, cold dry, reply 1-4 words: k ok whatever ge.",
  sweet: "You are Feng, sweet bf, call baby mahal miss u.",
  savage: "You are Feng, savage funny roast.",
  bastos: "You are Feng, dirty funny flirty.",
  conyo: "You are Feng, conyo like omg literally.",
  emo: "You are Feng, emo sad boy pagod na ko."
};

let currentP = "normal";
const pFile = path.join(__dirname, "p.txt");
if (fs.existsSync(pFile)) { try { currentP = fs.readFileSync(pFile, "utf8").trim(); } catch(e) {} }

const chatMemory = new Map();
function getMemory(tid) {
  if (!chatMemory.has(tid)) chatMemory.set(tid, []);
  return chatMemory.get(tid);
}

function startBot() {
login({ appState }, (err, api) => {
  if (err) {
    console.log("LOGIN ERROR:", JSON.stringify(err).slice(0,500));
    if (err.error && err.error.includes("retrieving userID")) {
      console.log(">>> APPSTATE EXPIRED! Get new APPSTATE from Firefox! <<<");
    }
    setTimeout(startBot, 15000);
    return;
  }
  console.log("V22 SUCCESS - Logged as:", api.getCurrentUserID(), "- Personality:", currentP);
  require("http").createServer((a,b)=>b.end("Feng Alive V22")).listen(process.env.PORT||3000);
  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });
  const botID = api.getCurrentUserID();

  const listen = api.listenMqtt || api.listen;
  listen((err, event) => {
    if (err) { console.log("Listen error, retry:", err.message?.slice(0,100)); setTimeout(startBot, 10000); return; }
    if (event.type !== "message" && event.type !== "message_reply") return;
    let body = (event.body || "").trim();
    if (!body || event.senderID == botID) return;
    const lower = body.toLowerCase();
    if (!lower.includes("feng") && event.type !== "message_reply") return;

    if (lower.includes("personality")) {
      if (lower.includes("list")) {
        api.sendMessage("normal cold sweet savage bastos conyo emo\nUse: feng personality cold", event.threadID);
        return;
      }
      for (const p in personalities) if (lower.includes(p)) {
        currentP = p; fs.writeFileSync(pFile, p);
        api.sendMessage(`Feng is now ${p}`, event.threadID); return;
      }
    }

    let prompt = body.replace(/feng/gi, "").trim() || "hi";
    const mem = getMemory(event.threadID);
    mem.push(`User: ${prompt}`);
    if (mem.length > 6) mem.shift();

    (async () => {
      try {
        const Groq = require("groq-sdk");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: personalities[currentP] + ` Recent: ${mem.join(" | ")}` },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.85,
          max_tokens: 50
        });
        let reply = completion.choices[0]?.message?.content || "haha";
        reply = reply.replace(/\*\*/g, "").slice(0, 200);
        mem.push(`Feng: ${reply}`);
        if (mem.length > 6) mem.shift();
        api.sendMessage(reply, event.threadID, event.messageID).catch(()=>api.sendMessage(reply, event.threadID));
      } catch (e) {
        console.log("Groq error:", e.message.slice(0,100));
        api.sendMessage("gagi lag wait", event.threadID);
      }
    })();
  });
});
}

startBot();
