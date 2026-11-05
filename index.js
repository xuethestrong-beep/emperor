const fs = require("fs");
const path = require("path");
const fca = require("ws3-fca");
const login = fca.default || fca.login || fca;

let appState;
try {
  if (process.env.APPSTATE) appState = JSON.parse(process.env.APPSTATE);
  else appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
} catch (e) {}

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

login({ appState }, (err, api) => {
  if (err) return console.error(err);
  console.log("V19 FIXED LISTEN - " + currentP);
  require("http").createServer((a,b)=>b.end("Alive")).listen(process.env.PORT||3000);
  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });
  const botID = api.getCurrentUserID();
  process.on("unhandledRejection", e => console.log("Caught", e.message?.slice(0,80)));

  // FIX FOR LATEST WS3-FCA - listenMqtt
  const listen = api.listenMqtt || api.listen;
  console.log("Using listen:", api.listenMqtt ? "listenMqtt" : "listen");

  listen(async (err, event) => {
    try {
      if (err) return;
      if (event.type !== "message" && event.type !== "message_reply") return;
      let body = (event.body || "").trim();
      if (!body || event.senderID == botID) return;
      const lower = body.toLowerCase();
      if (!lower.includes("feng") && event.type !== "message_reply") return;

      if (lower.includes("personality")) {
        if (lower.includes("list")) {
          await api.sendMessage("normal cold sweet savage bastos conyo emo\nUse: feng personality cold", event.threadID).catch(()=>{});
          return;
        }
        for (const p in personalities) if (lower.includes(p)) {
          currentP = p; fs.writeFileSync(pFile, p);
          await api.sendMessage(`Feng is now ${p}`, event.threadID).catch(()=>{}); return;
        }
      }

      let prompt = body.replace(/feng/gi, "").trim() || "hi";
      const mem = getMemory(event.threadID);
      mem.push(`User: ${prompt}`);
      if (mem.length > 6) mem.shift();

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
          max_tokens: 45
        });
        let reply = completion.choices[0]?.message?.content || "haha";
        reply = reply.replace(/\*\*/g, "").slice(0, 200);
        mem.push(`Feng: ${reply}`);
        if (mem.length > 6) mem.shift();
        await api.sendMessage(reply, event.threadID, event.messageID).catch(async () => {
          await api.sendMessage(reply, event.threadID).catch(()=>{});
        });
      } catch (e) {
        console.log("Groq error:", e.message.slice(0,150));
        await api.sendMessage("gagi lag wait", event.threadID).catch(()=>{});
      }
    } catch (e) { console.log("Loop error", e.message.slice(0,80)); }
  });
});
